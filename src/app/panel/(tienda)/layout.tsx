import { and, count, eq } from 'drizzle-orm'
import { db, orders } from '@/db'
import { PanelNav } from '@/components/panel/PanelNav'
import { requireMerchant } from '@/lib/auth'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { store } = await requireMerchant()
  const [{ n }] = await db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, 'NUEVO')))
  return (
    <div className="wrap panel">
      <PanelNav storeSlug={store.slug} newOrders={n} />
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  )
}
