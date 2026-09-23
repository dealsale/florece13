import type { Metadata } from 'next'
import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db, orderItems, orders } from '@/db'
import { Icon } from '@/components/Icon'
import { formatDate, formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/lib/orders'
import { appUrl } from '@/lib/url'
import { orderMessage, waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false } }

const STATUS_TEXT = {
  NUEVO: 'Enviado a la tienda. Esperando confirmación.',
  CONFIRMADO: 'La tienda confirmó tu pedido.',
  ENVIADO: 'Tu pedido va en camino.',
  ENTREGADO: 'Pedido entregado. ¡Gracias por comprarle a la 13!',
  CANCELADO: 'Este pedido fue cancelado.',
} as const

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nuevo?: string }>
}) {
  const { id } = await params
  const { nuevo } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { store: true, items: { orderBy: asc(orderItems.name) } },
  })
  if (!order) notFound()

  const url = appUrl(`/pedido/${order.id}`)
  const wa = waLink(order.store.whatsapp, orderMessage(order, order.store.name, url))

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <section className="section" style={{ paddingTop: 28 }}>
        {nuevo ? (
          <div className="stack" style={{ ['--gap' as string]: '14px', marginBottom: 24 }}>
            <span className="chip chip-florece" style={{ alignSelf: 'flex-start' }}>Pedido guardado</span>
            <h1 className="title">Último paso: envialo por WhatsApp.</h1>
            <p className="lede">Tocá el botón para abrir el chat con {order.store.name} con tu pedido ya escrito. Ahí acuerdan el envío y el pago.</p>
            <a className="btn btn-whatsapp btn-lg btn-block" href={wa} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={22} /> Enviar pedido por WhatsApp
            </a>
          </div>
        ) : (
          <div className="stack" style={{ ['--gap' as string]: '10px', marginBottom: 24 }}>
            <span className={`chip status-${order.status}`} style={{ alignSelf: 'flex-start' }}>{ORDER_STATUS_LABEL[order.status]}</span>
            <h1 className="title">Pedido {order.code}</h1>
            <p className="lede">{STATUS_TEXT[order.status]}</p>
          </div>
        )}

        <div className="card card-pad stack" style={{ ['--gap' as string]: '12px' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="label-muted">Pedido {order.code}</span>
            <span className="small muted">{formatDate(order.createdAt)}</span>
          </div>
          <div>
            {order.items.map((i) => (
              <div key={i.id} className="summary-line">
                <span>{i.quantity} × {i.name}</span>
                <span className="tnum">{formatPrice(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="totals" style={{ borderTop: '1px solid var(--linea)', paddingTop: 12 }}>
            <span>Total productos</span>
            <strong className="tnum">{formatPrice(order.total)}</strong>
          </div>
          <p className="small muted">
            {order.deliveryMethod === 'ENVIO' ? `Envío a ${order.address}, ${order.city}.` : 'Para recoger en la tienda.'} El costo del envío y el pago se acuerdan con la tienda.
          </p>
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          {!nuevo && (
            <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={20} /> Escribir a la tienda
            </a>
          )}
          <Link href={`/t/${order.store.slug}`} className="btn btn-outline">Ver la tienda</Link>
        </div>
        <p className="small muted" style={{ marginTop: 16 }}>Guardá este link para consultar el estado de tu pedido.</p>
      </section>
    </div>
  )
}
