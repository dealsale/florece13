import type { Metadata } from 'next'
import { and, asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db, orderItems, orders } from '@/db'
import { Icon } from '@/components/Icon'
import { setOrderStatus } from '@/lib/actions/merchant'
import { requireMerchant } from '@/lib/auth'
import { displayPhone, formatDate, formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from '@/lib/orders'
import { appUrl } from '@/lib/url'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Pedido' }

export default async function PedidoPanelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { store } = await requireMerchant('/panel/pedidos')
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.storeId, store.id)),
    with: { items: { orderBy: asc(orderItems.name) } },
  })
  if (!order) notFound()

  const first = order.customerName.split(' ')[0]
  const replies = {
    CONFIRMADO: `¡Hola, ${first}! Te habla ${store.name} desde Florece 13. Confirmamos tu pedido ${order.code} por ${formatPrice(order.total)}. Te cuento cómo quedamos con el pago y la entrega:`,
    ENVIADO: `¡Hola, ${first}! Tu pedido ${order.code} de ${store.name} ya va en camino. Podés ver el estado aquí: ${appUrl(`/pedido/${order.id}`)}`,
  }

  return (
    <div className="stack" style={{ ['--gap' as string]: '20px' }}>
      <Link href="/panel/pedidos" className="small" style={{ fontWeight: 700 }}>← Pedidos</Link>
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="label-muted">{formatDate(order.createdAt)}</p>
          <h1 className="title">Pedido {order.code}</h1>
        </div>
        <span className={`chip status-${order.status}`} style={{ fontSize: 13 }}>{ORDER_STATUS_LABEL[order.status]}</span>
      </div>

      <div className="card card-pad stack" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="subtitle">{order.customerName}</h2>
        <p className="tnum">{displayPhone(order.customerPhone)}{order.customerEmail && ` · ${order.customerEmail}`}</p>
        <p className="muted">
          {order.deliveryMethod === 'ENVIO' ? <>Envío a <strong style={{ color: 'var(--cemento)' }}>{order.address}, {order.city}</strong></> : 'Recoge en la tienda'}
        </p>
        {order.notes && <p className="alert alert-info" style={{ fontWeight: 500 }}>“{order.notes}”</p>}
        <div className="row">
          <a className="btn btn-whatsapp" href={waLink(order.customerPhone, replies.CONFIRMADO)} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={20} /> Escribirle
          </a>
          {order.status === 'ENVIADO' && (
            <a className="btn btn-outline" href={waLink(order.customerPhone, replies.ENVIADO)} target="_blank" rel="noopener noreferrer">Avisar que va en camino</a>
          )}
        </div>
      </div>

      <div className="card card-pad">
        {order.items.map((i) => (
          <div key={i.id} className="summary-line">
            <span>{i.quantity} × {i.productId ? <Link href={`/p/${i.productId}`}>{i.name}</Link> : i.name}</span>
            <span className="tnum">{formatPrice(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div className="totals" style={{ borderTop: '1px solid var(--linea)', paddingTop: 12, marginTop: 6 }}>
          <span>Total productos</span>
          <strong className="tnum">{formatPrice(order.total)}</strong>
        </div>
      </div>

      <form action={setOrderStatus.bind(null, order.id)} className="card card-pad stack" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="subtitle">Estado del pedido</h2>
        <p className="small muted">El comprador ve este estado en el link de su pedido.</p>
        <div className="choice-group">
          {ORDER_STATUSES.map((s) => (
            <label key={s} className="choice">
              <input type="radio" name="status" value={s} defaultChecked={order.status === s} />
              <span style={{ fontWeight: 600 }}>{ORDER_STATUS_LABEL[s]}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-dark" style={{ alignSelf: 'flex-start' }}>Actualizar estado</button>
      </form>
    </div>
  )
}
