import { and, count, eq } from 'drizzle-orm'
import { db, orders, products } from '@/db'
import { PanelNav } from '@/components/panel/PanelNav'
import { Tour } from '@/components/panel/Tour'
import { requireMerchant } from '@/lib/auth'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { store } = await requireMerchant()
  const [[{ n }], [{ p }]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, 'NUEVO'))),
    db.select({ p: count() }).from(products).where(eq(products.storeId, store.id)),
  ])
  const progress = { hasLogo: Boolean(store.logoUrl), hasCover: Boolean(store.coverUrl), storyOk: store.story.length > 40, products: p }
  return (
    <div className="wrap panel">
      <PanelNav storeSlug={store.slug} newOrders={n} />
      <div style={{ minWidth: 0 }}>{children}</div>
      {/* Arranca solo en tiendas nuevas (sin productos ni imagen); después se retoma desde el resumen. */}
      <Tour storeId={store.id} progress={progress} autoStart={p === 0 && !store.logoUrl && !store.coverUrl} />
    </div>
  )
}
