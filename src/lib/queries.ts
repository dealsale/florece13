import 'server-only'
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { cache } from 'react'
import { categories, db, productCategories, productImages, products, productVariants, storeCategories, stores } from '@/db'

export type ProductCardData = {
  id: string
  name: string
  price: number
  compareAtPrice: number | null
  imageUrl: string | null
  isAvailable: boolean
  storeName: string
  storeSlug: string
  storeId: string
  categorySlug: string | null
  kind: 'PRODUCTO' | 'SERVICIO'
  priceFrom: boolean
  hasOptions: boolean
  /** Precio más bajo entre las combinaciones disponibles (o el precio, si no tiene opciones). */
  minPrice: number
  maxPrice: number
}

export const getCategories = cache(async () =>
  db.select().from(categories).orderBy(asc(categories.position)),
)

/**
 * Primera foto de cada producto. Va con nombres de tabla explícitos: en consultas de una sola tabla
 * Drizzle escribe las columnas sin calificar y "id" terminaría apuntando a la foto, no al producto.
 */
export const firstImage = sql<string | null>`(
  select pi.url from product_images pi
  where pi.product_id = "products"."id"
  order by pi.position asc limit 1
)`

const cardColumns = {
  id: products.id,
  name: products.name,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  isAvailable: products.isAvailable,
  imageUrl: firstImage,
  storeName: stores.name,
  storeSlug: stores.slug,
  storeId: stores.id,
  categorySlug: categories.slug,
  kind: products.kind,
  priceFrom: products.priceFrom,
  hasOptions: sql<boolean>`jsonb_array_length(${products.options}) > 0`,
  minPrice: sql<number>`coalesce((select min(coalesce(pv.price, "products"."price")) from product_variants pv where pv.product_id = "products"."id" and pv.is_available), "products"."price")::int`,
  maxPrice: sql<number>`coalesce((select max(coalesce(pv.price, "products"."price")) from product_variants pv where pv.product_id = "products"."id" and pv.is_available), "products"."price")::int`,
}

/** Productos de una categoría (cualquiera de sus categorías, no solo la principal). */
const inProductCategory = (categoryId: string) =>
  sql`exists (select 1 from product_categories pc where pc.product_id = "products"."id" and pc.category_id = ${categoryId})`
const inStoreCategory = (categoryId: string) =>
  sql`exists (select 1 from store_categories sc where sc.store_id = "stores"."id" and sc.category_id = ${categoryId})`

/** Productos visibles al público: de tiendas aprobadas. */
export async function listProducts(opts: {
  q?: string
  categorySlug?: string
  storeId?: string
  limit?: number
  offset?: number
  includeUnavailable?: boolean
  kind?: 'PRODUCTO' | 'SERVICIO'
  /** Vista previa del dueño/admin: incluye tiendas aún no aprobadas. */
  includeInactiveStore?: boolean
}): Promise<ProductCardData[]> {
  const where = opts.includeInactiveStore ? [] : [eq(stores.status, 'ACTIVE')]
  if (!opts.includeUnavailable) where.push(eq(products.isAvailable, true))
  if (opts.storeId) where.push(eq(products.storeId, opts.storeId))
  if (opts.categorySlug) {
    const cat = (await getCategories()).find((c) => c.slug === opts.categorySlug)
    if (!cat) return []
    where.push(inProductCategory(cat.id))
  }
  if (opts.kind) where.push(eq(products.kind, opts.kind))
  if (opts.q) {
    const term = `%${opts.q.replace(/[%_]/g, '')}%`
    where.push(
      or(ilike(products.name, term), ilike(products.description, term), ilike(stores.name, term))!,
    )
  }
  return db
    .select(cardColumns)
    .from(products)
    .innerJoin(stores, eq(stores.id, products.storeId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...where))
    .orderBy(desc(products.createdAt))
    .limit(opts.limit ?? 24)
    .offset(opts.offset ?? 0)
}

export async function listStores(opts: { q?: string; categorySlug?: string; limit?: number }) {
  const where = [eq(stores.status, 'ACTIVE')]
  if (opts.categorySlug) {
    const cat = (await getCategories()).find((c) => c.slug === opts.categorySlug)
    if (!cat) return []
    where.push(inStoreCategory(cat.id))
  }
  if (opts.q) {
    const term = `%${opts.q.replace(/[%_]/g, '')}%`
    where.push(or(ilike(stores.name, term), ilike(stores.tagline, term), ilike(stores.story, term))!)
  }
  return db
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
      tagline: stores.tagline,
      sector: stores.sector,
      logoUrl: stores.logoUrl,
      coverUrl: stores.coverUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
      productCount: sql<number>`(
        select count(*)::int from ${products}
        where ${products.storeId} = ${stores.id} and ${products.isAvailable}
      )`,
    })
    .from(stores)
    .leftJoin(categories, eq(categories.id, stores.categoryId))
    .where(and(...where))
    .orderBy(desc(stores.createdAt))
    .limit(opts.limit ?? 24)
}

export type StoreCardData = Awaited<ReturnType<typeof listStores>>[number]

export async function getStoreBySlug(slug: string) {
  return db.query.stores.findFirst({
    where: eq(stores.slug, slug),
    with: { category: true, categories: { with: { category: true } } },
  })
}

export async function getProduct(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: asc(productImages.position) },
      variants: { orderBy: asc(productVariants.position) },
      categories: { with: { category: true } },
      store: true,
      category: true,
    },
  })
}

/** Datos frescos para el carrito: precio y disponibilidad actuales. */
export async function getProductsForCart(ids: string[]) {
  const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
  if (valid.length === 0) return []
  return db
    .select({ ...cardColumns, storeStatus: stores.status })
    .from(products)
    .innerJoin(stores, eq(stores.id, products.storeId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(inArray(products.id, valid))
}

/** Números del barrio para el inicio: tiendas, productos, sectores y productos por categoría. */
export async function getHomeStats() {
  const [[totals], perCategory] = await Promise.all([
    db
      .select({
        stores: sql<number>`count(distinct ${stores.id})::int`,
        products: sql<number>`count(${products.id})::int`,
        sectors: sql<number>`count(distinct nullif(${stores.sector}, ''))::int`,
      })
      .from(stores)
      .leftJoin(products, and(eq(products.storeId, stores.id), eq(products.isAvailable, true)))
      .where(eq(stores.status, 'ACTIVE')),
    db
      .select({ slug: categories.slug, n: sql<number>`count(${products.id})::int` })
      .from(categories)
      .leftJoin(productCategories, eq(productCategories.categoryId, categories.id))
      .leftJoin(products, and(eq(products.id, productCategories.productId), eq(products.isAvailable, true)))
      .leftJoin(stores, eq(stores.id, products.storeId))
      .where(or(sql`${products.id} is null`, eq(stores.status, 'ACTIVE')))
      .groupBy(categories.slug),
  ])
  return { ...totals, perCategory: Object.fromEntries(perCategory.map((c) => [c.slug, c.n])) as Record<string, number> }
}

/** Ids de categorías de una tienda o producto, con la principal primero. */
export async function getStoreCategoryIds(storeId: string, primaryId: string | null) {
  const rows = await db.select({ id: storeCategories.categoryId }).from(storeCategories).where(eq(storeCategories.storeId, storeId))
  return primaryFirst(rows.map((r) => r.id), primaryId)
}
export async function getProductCategoryIds(productId: string, primaryId: string | null) {
  const rows = await db.select({ id: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, productId))
  return primaryFirst(rows.map((r) => r.id), primaryId)
}
function primaryFirst(ids: string[], primaryId: string | null) {
  if (primaryId && !ids.includes(primaryId)) ids.unshift(primaryId)
  return primaryId ? [primaryId, ...ids.filter((id) => id !== primaryId)] : ids
}

/**
 * Categorías con cuántas publicaciones y tiendas activas tiene cada una.
 * El inicio y los filtros muestran solo las que tienen algo; los formularios muestran todas.
 */
export const getCategoryUsage = cache(async () =>
  db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      icon: categories.icon,
      position: categories.position,
      products: sql<number>`(select count(*) from product_categories pc join products p on p.id = pc.product_id join stores s on s.id = p.store_id where pc.category_id = "categories"."id" and p.is_available and s.status = 'ACTIVE')::int`,
      stores: sql<number>`(select count(*) from store_categories sc join stores s on s.id = sc.store_id where sc.category_id = "categories"."id" and s.status = 'ACTIVE')::int`,
    })
    .from(categories)
    .orderBy(asc(categories.position)),
)
