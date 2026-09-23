import type { Metadata } from 'next'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { db, orders } from '@/db'
import { EmptyState } from '@/components/EmptyState'
import { requireMerchant } from '@/lib/auth'
import { formatDate, formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from '@/lib/orders'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { store } = await requireMerchant('/panel/pedidos')
  const { estado } = await searchParams
  const status = ORDER_STATUSES.includes(estado as OrderStatus) ? (estado as OrderStatus) : undefined
  const rows = await db
    .select()
    .from(orders)
    .where(status ? and(eq(orders.storeId, store.id), eq(orders.status, status)) : eq(orders.storeId, store.id))
    .orderBy(desc(orders.createdAt))
    .limit(200)

  return (
    <div>
      <div className="panel-head"><h1 className="title">Pedidos</h1></div>
      <div className="cat-scroller" style={{ marginBottom: 16 }}>
        <Link href="/panel/pedidos" className="cat-pill" aria-current={!status ? 'true' : undefined}>Todos</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/panel/pedidos?estado=${s}`} className="cat-pill" aria-current={status === s ? 'true' : undefined}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="pedidos" title={status ? 'No hay pedidos en este estado.' : 'Aquí van a llegar tus pedidos.'} text="Compartí tu tienda y tu QR para que te encuentren." />
      ) : (
        <div className="list">
          {rows.map((o) => (
            <Link key={o.id} href={`/panel/pedidos/${o.id}`} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{o.customerName}</div>
                <div className="list-row__sub">
                  {o.code} · {formatDate(o.createdAt)} · {o.deliveryMethod === 'ENVIO' ? `Envío a ${o.city}` : 'Recoge'}
                </div>
              </div>
              <span className="price tnum">{formatPrice(o.total)}</span>
              <span className={`chip status-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
