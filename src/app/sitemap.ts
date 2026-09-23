import type { MetadataRoute } from 'next'
import { and, eq } from 'drizzle-orm'
import { db, products, stores } from '@/db'
import { appUrl } from '@/lib/url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [storeRows, productRows] = await Promise.all([
    db.select({ slug: stores.slug, updatedAt: stores.updatedAt }).from(stores).where(eq(stores.status, 'ACTIVE')),
    db
      .select({ id: products.id, updatedAt: products.updatedAt })
      .from(products)
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(and(eq(stores.status, 'ACTIVE'), eq(products.isAvailable, true))),
  ])
  return [
    { url: appUrl('/') },
    { url: appUrl('/tiendas') },
    { url: appUrl('/buscar') },
    { url: appUrl('/vende') },
    ...storeRows.map((s) => ({ url: appUrl(`/t/${s.slug}`), lastModified: s.updatedAt })),
    ...productRows.map((p) => ({ url: appUrl(`/p/${p.id}`), lastModified: p.updatedAt })),
  ]
}
