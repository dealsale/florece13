'use server'

import { randomInt } from 'node:crypto'
import { and, count, eq, gt, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db, orderItems, orders, products, stores } from '@/db'
import { normalizePhone } from '@/lib/format'
import { getProductsForCart } from '@/lib/queries'

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
  return rows.map((r) => ({ ...r, store: storeRows.find((s) => s.id === r.storeId)! }))
}

export type CartProduct = Awaited<ReturnType<typeof getCartProducts>>[number]

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const newCode = () => `F13-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`

const orderSchema = z
  .object({
    storeId: z.uuid(),
    items: z
      .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(99) }))
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
  const lines = data.items.map((i) => ({ ...i, product: rows.find((r) => r.id === i.productId) }))
  const missing = lines.filter((l) => !l.product || !l.product.isAvailable)
  if (missing.length)
    return { ok: false, message: 'Algunos productos ya no están disponibles. Revisá tu carrito.' }

  const subtotal = lines.reduce((sum, l) => sum + l.product!.price * l.quantity, 0)

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
          lines.map((l) => ({
            orderId: order.id,
            productId: l.product!.id,
            name: l.product!.name,
            unitPrice: l.product!.price,
            quantity: l.quantity,
          })),
        )
        return order.id
      })
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
