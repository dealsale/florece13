'use server'

import { after } from 'next/server'
import { notifyNewOrder, safeNotify } from '@/lib/notify'
import { randomInt } from 'node:crypto'
import { and, count, eq, gt, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db, orderItems, orders, products, productVariants, stores } from '@/db'
import { normalizePhone } from '@/lib/format'
import { getProductsForCart } from '@/lib/queries'
import { variantLabel } from '@/lib/variants'

export async function getCartProducts(ids: string[]) {
  if (!Array.isArray(ids)) return []
  const rows = await getProductsForCart(ids.slice(0, 100))
  const storeIds = [...new Set(rows.map((r) => r.storeId))]
  const storeRows = storeIds.length
    ? await db
        .select({
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          logoUrl: stores.logoUrl,
          status: stores.status,
        })
        .from(stores)
        .where(inArray(stores.id, storeIds))
    : []
  const productIds = rows.map((r) => r.id)
  const [variantRows, optionRows] = productIds.length
    ? await Promise.all([
        db
          .select({ id: productVariants.id, productId: productVariants.productId, values: productVariants.values, price: productVariants.price, isAvailable: productVariants.isAvailable })
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds)),
        db.select({ id: products.id, options: products.options }).from(products).where(inArray(products.id, productIds)),
      ])
    : [[], []]
  return rows.map((r) => ({
    ...r,
    store: storeRows.find((s) => s.id === r.storeId)!,
    options: optionRows.find((o) => o.id === r.id)?.options ?? [],
    variants: variantRows.filter((v) => v.productId === r.id),
  }))
}

export type CartProduct = Awaited<ReturnType<typeof getCartProducts>>[number]

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const newCode = () => `F13-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`

const orderSchema = z
  .object({
    storeId: z.uuid(),
    items: z
      .array(z.object({ productId: z.uuid(), variantId: z.uuid().optional(), quantity: z.number().int().min(1).max(99) }))
      .min(1, 'El carrito está vacío.')
      .max(50),
    customerName: z.string().trim().min(2, 'Escribí tu nombre.').max(80),
    customerPhone: z
      .string()
      .transform(normalizePhone)
      .refine((v) => v.length >= 10 && v.length <= 15, 'Revisá tu número de celular.'),
    customerEmail: z.union([z.literal(''), z.email('Revisá el correo.')]),
    deliveryMethod: z.enum(['ENVIO', 'RECOGER']),
    city: z.string().trim().max(80),
    address: z.string().trim().max(200),
    notes: z.string().trim().max(500),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod === 'ENVIO') {
      if (v.city.length < 2) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Escribí la ciudad.' })
      if (v.address.length < 5) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Escribí la dirección de entrega.' })
    }
  })

export type OrderState =
  | { ok: true; orderId: string }
  | { ok: false; message?: string; errors?: Record<string, string[] | undefined> }
  | null

export async function createOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  // Campo trampa para bots: las personas no lo ven.
  if (formData.get('website')) return { ok: false, message: 'No pudimos enviar el pedido.' }

  let items: unknown
  try {
    items = JSON.parse(String(formData.get('items') ?? '[]'))
  } catch {
    items = []
  }
  const parsed = orderSchema.safeParse({
    storeId: formData.get('storeId'),
    items,
    customerName: formData.get('customerName') ?? '',
    customerPhone: formData.get('customerPhone') ?? '',
    customerEmail: String(formData.get('customerEmail') ?? '').trim(),
    deliveryMethod: formData.get('deliveryMethod'),
    city: formData.get('city') ?? '',
    address: formData.get('address') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error)
    return { ok: false, errors: flat.fieldErrors, message: flat.formErrors[0] }
  }
  const data = parsed.data

  const [store] = await db.select().from(stores).where(eq(stores.id, data.storeId)).limit(1)
  if (!store || store.status !== 'ACTIVE') return { ok: false, message: 'Esta tienda no está recibiendo pedidos.' }
  if (data.deliveryMethod === 'ENVIO' && !store.shipsNationwide)
    return { ok: false, message: 'Esta tienda solo entrega para recoger en el local.' }
  if (data.deliveryMethod === 'RECOGER' && !store.allowsPickup)
    return { ok: false, message: 'Esta tienda solo hace envíos.' }

  // Límite simple contra abuso: 5 pedidos por celular por hora.
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(orders)
    .where(and(eq(orders.customerPhone, data.customerPhone), gt(orders.createdAt, new Date(Date.now() - 3600_000))))
  if (recent >= 5) return { ok: false, message: 'Ya enviaste varios pedidos en la última hora. Esperá un rato o escribile a la tienda.' }

  // Precios y disponibilidad salen de la base, nunca del navegador.
  const ids = [...new Set(data.items.map((i) => i.productId))]
  const rows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.storeId, store.id)))
  const variantRows = ids.length ? await db.select().from(productVariants).where(inArray(productVariants.productId, ids)) : []
  const resolved = data.items.map((i) => {
    const product = rows.find((r) => r.id === i.productId)
    if (!product || !product.isAvailable || product.kind !== 'PRODUCTO') return null
    // Con opciones hay que traer una combinación válida y disponible de ese mismo producto.
    const variant = i.variantId ? variantRows.find((v) => v.id === i.variantId && v.productId === product.id) : undefined
    if (product.options.length > 0 ? !variant || !variant.isAvailable : i.variantId) return null
    const label = variant ? variantLabel(variant.values) : ''
    return {
      quantity: i.quantity,
      productId: product.id,
      variantId: variant?.id ?? null,
      variantLabel: label,
      name: label ? `${product.name} · ${label}` : product.name,
      unitPrice: variant?.price ?? product.price,
    }
  })
  if (resolved.some((l) => l === null)) return { ok: false, message: 'Algunos productos o tallas ya no están disponibles. Revisá tu carrito.' }
  const lines = resolved as NonNullable<(typeof resolved)[number]>[]

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const orderId = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            code: newCode(),
            storeId: store.id,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            deliveryMethod: data.deliveryMethod,
            city: data.deliveryMethod === 'ENVIO' ? data.city : '',
            address: data.deliveryMethod === 'ENVIO' ? data.address : '',
            notes: data.notes,
            subtotal,
            total: subtotal,
            channel: 'WHATSAPP',
          })
          .returning({ id: orders.id })
        await tx.insert(orderItems).values(
          lines.map((l) => ({ ...l, orderId: order.id })),
        )
        return order.id
      })
      // Aviso a la tienda (bandeja + push) después de responder: no demora ni tumba el pedido.
      after(() => safeNotify(() => notifyNewOrder(orderId)))
      return { ok: true, orderId }
    } catch (err) {
      // Choque de código único: reintentar con otro.
      if ((err as { code?: string }).code === '23505' && attempt < 4) continue
      console.error('createOrder', err)
      return { ok: false, message: 'No pudimos guardar el pedido. Intentá de nuevo.' }
    }
  }
  return { ok: false, message: 'No pudimos guardar el pedido. Intentá de nuevo.' }
}
