import 'server-only'
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { cache } from 'react'
import { categories, db, productImages, products, stores } from '@/db'

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
}

export const getCategories = cache(async () =>
  db.select().from(categories).orderBy(asc(categories.position)),
)

const firstImage = sql<string | null>`(
  select ${productImages.url} from ${productImages}
  where ${productImages.productId} = ${products.id}
  order by ${productImages.position} asc limit 1
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
}

/** Productos visibles al público: de tiendas aprobadas. */
export async function listProducts(opts: {
  q?: string
  categorySlug?: string
  storeId?: string
  limit?: number
  offset?: number
  includeUnavailable?: boolean
  /** Vista previa del dueño/admin: incluye tiendas aún no aprobadas. */
  includeInactiveStore?: boolean
}): Promise<ProductCardData[]> {
  const where = opts.includeInactiveStore ? [] : [eq(stores.status, 'ACTIVE')]
  if (!opts.includeUnavailable) where.push(eq(products.isAvailable, true))
  if (opts.storeId) where.push(eq(products.storeId, opts.storeId))
  if (opts.categorySlug) {
    const cat = (await getCategories()).find((c) => c.slug === opts.categorySlug)
    if (!cat) return []
    where.push(eq(products.categoryId, cat.id))
  }
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
    where.push(eq(stores.categoryId, cat.id))
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
    with: { category: true },
  })
}

export async function getProduct(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: asc(productImages.position) },
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
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isAvailable, true)))
      .leftJoin(stores, eq(stores.id, products.storeId))
      .where(or(sql`${products.id} is null`, eq(stores.status, 'ACTIVE')))
      .groupBy(categories.slug),
  ])
  return { ...totals, perCategory: Object.fromEntries(perCategory.map((c) => [c.slug, c.n])) as Record<string, number> }
}
