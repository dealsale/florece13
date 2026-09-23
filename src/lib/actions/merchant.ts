'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { categories, db, orders, productImages, products, stores } from '@/db'
import { getStoreForUser, requireMerchant, requireUser } from '@/lib/auth'
import { normalizePhone, slugify } from '@/lib/format'
import { ORDER_STATUSES } from '@/lib/orders'
import { isOwnMediaUrl } from '@/lib/storage'

export type FormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
} | null

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const RESERVED = new Set(['admin', 'panel', 'api', 'florece', 'florece13', 'media', 'tienda', 'tiendas'])

const whatsappField = z
  .string()
  .transform(normalizePhone)
  .refine((v) => /^573\d{9}$/.test(v) || (/^\d{11,15}$/.test(v) && !v.startsWith('57')), 'Escribí un celular válido, p. ej. 300 123 4567.')

const optionalImage = z
  .string()
  .refine((v) => v === '' || isOwnMediaUrl(v), 'Foto inválida.')
  .transform((v) => v || null)

const storeSchema = z.object({
  name: z.string().min(2, 'Escribí el nombre de tu tienda.').max(60),
  tagline: z.string().max(120, 'Máximo 120 caracteres.'),
  categoryId: z.uuid('Elegí una categoría.'),
  whatsapp: whatsappField,
  sector: z.string().max(80),
  instagram: z
    .string()
    .transform((v) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, ''))
    .refine((v) => v === '' || /^[\w.]{1,30}$/.test(v), 'Revisá el usuario de Instagram.'),
})

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || 'tienda'
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    if (RESERVED.has(candidate)) continue
    const [hit] = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, candidate)).limit(1)
    if (!hit || hit.id === excludeId) return candidate
  }
  return `${base}-${Date.now().toString(36)}`
}

async function categoryExists(id: string) {
  const [c] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1)
  return Boolean(c)
}

export async function createStore(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/panel/crear-tienda')
  if (await getStoreForUser(user.id)) redirect('/panel')

  const parsed = storeSchema.safeParse({
    name: str(fd, 'name'),
    tagline: str(fd, 'tagline'),
    categoryId: str(fd, 'categoryId'),
    whatsapp: str(fd, 'whatsapp'),
    sector: str(fd, 'sector'),
    instagram: str(fd, 'instagram'),
  })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors }
  if (!(await categoryExists(parsed.data.categoryId))) return { errors: { categoryId: ['Elegí una categoría.'] } }

  await db.insert(stores).values({ ...parsed.data, ownerId: user.id, slug: await uniqueSlug(parsed.data.name) })
  redirect('/panel?bienvenida=1')
}

const storeSettingsSchema = storeSchema.extend({
  story: z.string().max(3000, 'Máximo 3000 caracteres.'),
  address: z.string().max(200),
  logoUrl: optionalImage,
  coverUrl: optionalImage,
  shipsNationwide: z.boolean(),
  allowsPickup: z.boolean(),
})

export async function updateStore(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/tienda')
  const parsed = storeSettingsSchema.safeParse({
    name: str(fd, 'name'),
    tagline: str(fd, 'tagline'),
    categoryId: str(fd, 'categoryId'),
    whatsapp: str(fd, 'whatsapp'),
    sector: str(fd, 'sector'),
    instagram: str(fd, 'instagram'),
    story: str(fd, 'story'),
    address: str(fd, 'address'),
    logoUrl: str(fd, 'logoUrl'),
    coverUrl: str(fd, 'coverUrl'),
    shipsNationwide: fd.get('shipsNationwide') === 'on',
    allowsPickup: fd.get('allowsPickup') === 'on',
  })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  if (!parsed.data.shipsNationwide && !parsed.data.allowsPickup)
    return { message: 'Elegí al menos una forma de entrega: envío o recoger.' }
  if (!(await categoryExists(parsed.data.categoryId))) return { errors: { categoryId: ['Elegí una categoría.'] } }

  await db.update(stores).set(parsed.data).where(eq(stores.id, store.id))
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Cambios guardados.' }
}

const productSchema = z.object({
  name: z.string().min(2, 'Escribí el nombre del producto.').max(100),
  description: z.string().max(3000, 'Máximo 3000 caracteres.'),
  price: z.number({ error: 'Escribí el precio.' }).int().min(500, 'El precio mínimo es $ 500.').max(100_000_000),
  compareAtPrice: z.number().int().positive().nullable(),
  categoryId: z.uuid('Elegí una categoría.'),
  isAvailable: z.boolean(),
  images: z.array(z.string().refine(isOwnMediaUrl, 'Foto inválida.')).max(6),
})

const money = (v: string) => {
  const digits = v.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

function parseProduct(fd: FormData) {
  let images: unknown = []
  try {
    images = JSON.parse(str(fd, 'images') || '[]')
  } catch {}
  return productSchema.safeParse({
    name: str(fd, 'name'),
    description: str(fd, 'description'),
    price: money(str(fd, 'price')) ?? undefined,
    compareAtPrice: money(str(fd, 'compareAtPrice')),
    categoryId: str(fd, 'categoryId'),
    isAvailable: fd.get('isAvailable') === 'on',
    images,
  })
}

async function saveImages(productId: string, urls: string[]) {
  await db.delete(productImages).where(eq(productImages.productId, productId))
  if (urls.length) await db.insert(productImages).values(urls.map((url, position) => ({ productId, url, position })))
}

export async function createProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/productos/nuevo')
  const parsed = parseProduct(fd)
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  const { images, ...data } = parsed.data
  if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) data.compareAtPrice = null
  if (images.length === 0) return { errors: { images: ['Subí al menos una foto: es lo primero que mira el comprador.'] } }

  const [product] = await db.insert(products).values({ ...data, storeId: store.id }).returning({ id: products.id })
  await saveImages(product.id, images)
  revalidatePath('/', 'layout')
  redirect('/panel/productos?creado=1')
}

async function ownProduct(productId: string) {
  const { store } = await requireMerchant('/panel/productos')
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
    .limit(1)
  if (!product) redirect('/panel/productos')
  return product
}

export async function updateProduct(productId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await ownProduct(productId)
  const parsed = parseProduct(fd)
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  const { images, ...data } = parsed.data
  if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) data.compareAtPrice = null
  if (images.length === 0) return { errors: { images: ['Dejá al menos una foto.'] } }

  await db.update(products).set(data).where(eq(products.id, productId))
  await saveImages(productId, images)
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Producto actualizado.' }
}

export async function deleteProduct(productId: string) {
  await ownProduct(productId)
  await db.delete(products).where(eq(products.id, productId))
  revalidatePath('/', 'layout')
  redirect('/panel/productos')
}

export async function toggleAvailability(productId: string) {
  const product = await ownProduct(productId)
  await db.update(products).set({ isAvailable: !product.isAvailable }).where(eq(products.id, productId))
  revalidatePath('/', 'layout')
}

export async function setOrderStatus(orderId: string, fd: FormData) {
  const { store } = await requireMerchant('/panel/pedidos')
  const status = str(fd, 'status')
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return
  await db
    .update(orders)
    .set({ status: status as (typeof ORDER_STATUSES)[number] })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
  revalidatePath('/panel', 'layout')
}
