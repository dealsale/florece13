'use server'

import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { notifyNewStore, safeNotify } from '@/lib/notify'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { categories, db, orders, productCategories, productImages, products, productVariants, storeCategories, stores } from '@/db'
import type { ProductOption } from '@/db/schema'
import { getStoreForUser, requireMerchant, requireUser } from '@/lib/auth'
import { normalizePhone, slugify } from '@/lib/format'
import { ORDER_STATUSES } from '@/lib/orders'
import { isOwnMediaUrl } from '@/lib/storage'
import { MAX_OPTION_GROUPS, MAX_OPTION_VALUES, MAX_VARIANTS, combinations, variantKey } from '@/lib/variants'

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

/** Lista de categorías en JSON (la primera es la principal). */
const categoryIdsField = (max: number) =>
  z
    .string()
    .transform((v, ctx) => {
      try {
        const arr = JSON.parse(v || '[]')
        if (Array.isArray(arr)) return [...new Set(arr.map(String))]
      } catch {}
      ctx.addIssue({ code: 'custom', message: 'Elegí al menos una categoría.' })
      return z.NEVER
    })
    .pipe(z.array(z.uuid()).min(1, 'Elegí al menos una categoría.').max(max, `Elegí hasta ${max}.`))

const storeSchema = z.object({
  name: z.string().min(2, 'Escribí el nombre de tu tienda.').max(60),
  tagline: z.string().max(120, 'Máximo 120 caracteres.'),
  categoryIds: categoryIdsField(4),
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

/** Solo las categorías que existen, en el orden elegido. */
async function existingCategories(ids: string[]) {
  const rows = await db.select({ id: categories.id }).from(categories).where(inArray(categories.id, ids))
  return ids.filter((id) => rows.some((r) => r.id === id))
}

async function setStoreCategories(storeId: string, ids: string[]) {
  await db.delete(storeCategories).where(eq(storeCategories.storeId, storeId))
  await db.insert(storeCategories).values(ids.map((categoryId) => ({ storeId, categoryId }))).onConflictDoNothing()
}

export async function createStore(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/panel/crear-tienda')
  if (await getStoreForUser(user.id)) redirect('/panel')

  const parsed = storeSchema.safeParse({
    name: str(fd, 'name'),
    tagline: str(fd, 'tagline'),
    categoryIds: str(fd, 'categoryIds'),
    whatsapp: str(fd, 'whatsapp'),
    sector: str(fd, 'sector'),
    instagram: str(fd, 'instagram'),
  })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors }
  const { categoryIds, ...data } = parsed.data
  const cats = await existingCategories(categoryIds)
  if (cats.length === 0) return { errors: { categoryIds: ['Elegí al menos una categoría.'] } }

  const [created] = await db
    .insert(stores)
    .values({ ...data, categoryId: cats[0], ownerId: user.id, slug: await uniqueSlug(data.name) })
    .returning({ id: stores.id })
  await setStoreCategories(created.id, cats)
  after(() => safeNotify(() => notifyNewStore(created.id)))
  revalidatePath('/', 'layout')
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
    categoryIds: str(fd, 'categoryIds'),
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
  const { categoryIds, ...data } = parsed.data
  const cats = await existingCategories(categoryIds)
  if (cats.length === 0) return { errors: { categoryIds: ['Elegí al menos una categoría.'] } }

  await db.update(stores).set({ ...data, categoryId: cats[0] }).where(eq(stores.id, store.id))
  await setStoreCategories(store.id, cats)
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Cambios guardados.' }
}

const optionsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1, 'Ponele nombre a cada opción (Color, Talla…).').max(30),
      values: z
        .array(z.object({ v: z.string().trim().min(1).max(30), img: z.string().nullish() }))
        .min(1, 'Cada opción necesita al menos un valor.')
        .max(MAX_OPTION_VALUES, `Máximo ${MAX_OPTION_VALUES} valores por opción.`),
    }),
  )
  .max(MAX_OPTION_GROUPS, `Máximo ${MAX_OPTION_GROUPS} opciones.`)

const variantsInput = z.object({
  options: optionsSchema,
  variants: z
    .array(z.object({ values: z.array(z.string().trim()), price: z.number().int().min(500, 'El precio mínimo es $ 500.').max(100_000_000).nullable(), available: z.boolean() }))
    .max(MAX_VARIANTS, `Máximo ${MAX_VARIANTS} combinaciones.`),
})

const productSchema = z.object({
  kind: z.enum(['PRODUCTO', 'SERVICIO']),
  name: z.string().min(2, 'Escribí el nombre.').max(100),
  description: z.string().max(3000, 'Máximo 3000 caracteres.'),
  price: z.number({ error: 'Escribí el precio.' }).int().min(500, 'El precio mínimo es $ 500.').max(100_000_000),
  compareAtPrice: z.number().int().positive().nullable(),
  priceFrom: z.boolean(),
  duration: z.string().trim().max(60),
  categoryIds: categoryIdsField(3),
  isAvailable: z.boolean(),
  images: z.array(z.string().refine(isOwnMediaUrl, 'Foto inválida.')).max(6),
  variants: variantsInput,
})

const money = (v: string) => {
  const digits = v.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

function parseJson<T>(raw: string, fallback: T): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function parseProduct(fd: FormData) {
  return productSchema.safeParse({
    kind: str(fd, 'kind') === 'SERVICIO' ? 'SERVICIO' : 'PRODUCTO',
    name: str(fd, 'name'),
    description: str(fd, 'description'),
    price: money(str(fd, 'price')) ?? undefined,
    compareAtPrice: money(str(fd, 'compareAtPrice')),
    priceFrom: fd.get('priceFrom') === 'on',
    duration: str(fd, 'duration'),
    categoryIds: str(fd, 'categoryIds'),
    isAvailable: fd.get('isAvailable') === 'on',
    images: parseJson(str(fd, 'images') || '[]', []),
    variants: parseJson(str(fd, 'variants') || '{"options":[],"variants":[]}', { options: [], variants: [] }),
  })
}

type ParsedProduct = z.infer<typeof productSchema>

/**
 * Normaliza opciones y variantes: valores sin repetir, fotos solo de las del producto y
 * exactamente una variante por combinación (las que no vinieron quedan disponibles, con el precio base).
 */
function normalizeVariants(input: ParsedProduct['variants'], images: string[]) {
  const options: ProductOption[] = input.options
    .map((o) => {
      const seen = new Set<string>()
      return {
        name: o.name,
        values: o.values
          .filter((v) => !seen.has(v.v.toLowerCase()) && seen.add(v.v.toLowerCase()))
          .map((v) => ({ v: v.v, img: v.img && images.includes(v.img) ? v.img : null })),
      }
    })
    .filter((o) => o.values.length > 0)
  const combos = combinations(options)
  if (combos.length > MAX_VARIANTS) return { error: `Son ${combos.length} combinaciones; el máximo es ${MAX_VARIANTS}. Quitá algunos valores.` }
  const given = new Map(input.variants.map((v) => [variantKey(v.values), v]))
  const variants = combos.map((values, position) => {
    const g = given.get(variantKey(values))
    return { values, price: g?.price ?? null, isAvailable: g?.available ?? true, position }
  })
  return { options, variants }
}

/** Guarda las variantes conservando el id de las que ya existían (los carritos guardan ese id). */
async function saveVariants(productId: string, variants: { values: string[]; price: number | null; isAvailable: boolean; position: number }[]) {
  const existing = await db.select().from(productVariants).where(eq(productVariants.productId, productId))
  const byKey = new Map(existing.map((v) => [variantKey(v.values), v]))
  const keep: string[] = []
  for (const v of variants) {
    const hit = byKey.get(variantKey(v.values))
    if (hit) {
      keep.push(hit.id)
      await db.update(productVariants).set(v).where(eq(productVariants.id, hit.id))
    } else {
      const [row] = await db.insert(productVariants).values({ ...v, productId }).returning({ id: productVariants.id })
      keep.push(row.id)
    }
  }
  await db
    .delete(productVariants)
    .where(keep.length ? and(eq(productVariants.productId, productId), notInArray(productVariants.id, keep)) : eq(productVariants.productId, productId))
}

async function saveProductCategories(productId: string, ids: string[]) {
  await db.delete(productCategories).where(eq(productCategories.productId, productId))
  await db.insert(productCategories).values(ids.map((categoryId) => ({ productId, categoryId }))).onConflictDoNothing()
}

async function saveImages(productId: string, urls: string[]) {
  await db.delete(productImages).where(eq(productImages.productId, productId))
  if (urls.length) await db.insert(productImages).values(urls.map((url, position) => ({ productId, url, position })))
}

/** Valida todo y deja los datos listos para guardar (o devuelve los errores para el formulario). */
async function prepareProduct(fd: FormData, isNew: boolean) {
  const parsed = parseProduct(fd)
  if (!parsed.success) return { state: { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' } as FormState }
  const { images, categoryIds, variants: variantsRaw, ...data } = parsed.data
  if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) data.compareAtPrice = null
  if (data.kind === 'PRODUCTO') {
    data.priceFrom = false
    data.duration = ''
  }
  if (images.length === 0)
    return { state: { errors: { images: [isNew ? 'Subí al menos una foto: es lo primero que mira el comprador.' : 'Dejá al menos una foto.'] } } as FormState }
  const cats = await existingCategories(categoryIds)
  if (cats.length === 0) return { state: { errors: { categoryIds: ['Elegí al menos una categoría.'] } } as FormState }
  const v = normalizeVariants(variantsRaw, images)
  if ('error' in v) return { state: { errors: { variants: [v.error!] }, message: 'Revisá las opciones.' } as FormState }
  return { data: { ...data, categoryId: cats[0], options: v.options }, images, cats, variants: v.variants }
}

export async function createProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/productos/nuevo')
  const prep = await prepareProduct(fd, true)
  if (!prep.data) return prep.state!
  const [product] = await db.insert(products).values({ ...prep.data, storeId: store.id }).returning({ id: products.id })
  await Promise.all([saveImages(product.id, prep.images), saveProductCategories(product.id, prep.cats), saveVariants(product.id, prep.variants)])
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
  const prep = await prepareProduct(fd, false)
  if (!prep.data) return prep.state!
  await db.update(products).set(prep.data).where(eq(products.id, productId))
  await Promise.all([saveImages(productId, prep.images), saveProductCategories(productId, prep.cats), saveVariants(productId, prep.variants)])
  revalidatePath('/', 'layout')
  return { ok: true, message: prep.data.kind === 'SERVICIO' ? 'Servicio actualizado.' : 'Producto actualizado.' }
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
