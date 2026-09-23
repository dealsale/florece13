import type { Metadata } from 'next'
import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db, orderItems, orders } from '@/db'
import { Icon } from '@/components/Icon'
import { Svg } from '@/components/Svg'
import { flower } from '@/lib/art'
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

const PETAL_COLORS = ['#E5379B', '#FF8A00', '#17BEBB', '#2ECC71']
const BLOOM = `<svg viewBox="-60 -60 120 120" width="110" height="110" aria-hidden="true"><circle r="56" fill="#fff"/><path d="M0 8 C 3 25, -3 38, 0 50" stroke="#128C4B" stroke-width="5" fill="none"/><g transform="scale(1.9)">${flower('bloom')}</g></svg>`

export default async function PedidoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
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
    <div className="wrap" style={{ maxWidth: 720 }}>
      <section className="stack" style={{ paddingTop: 28 }}>
        {nuevo ? (
          <div className="done">
            {Array.from({ length: 22 }, (_, k) => (
              <span key={k} className="petal" style={{ left: `${(k * 4.6 + 2).toFixed(1)}%`, ['--d' as string]: `${(k % 7) * 0.12}s`, background: PETAL_COLORS[k % 4] }} />
            ))}
            <Svg html={BLOOM} className="done__flower" />
            <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 22 }}>¡pedido guardado!</span>
            <h1 className="h1">Último paso: envialo por WhatsApp.</h1>
            <p className="lede">Tocá el botón para abrir el chat con {order.store.name} con tu pedido ya escrito. Ahí acuerdan el envío y el pago.</p>
            <a className="btn btn-wa btn-lg btn-block" href={wa} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={22} /> Enviar pedido por WhatsApp
            </a>
          </div>
        ) : (
          <div className="stack rise" style={{ ['--gap' as string]: '10px' }}>
            <span className={`chip st-${order.status}`} style={{ alignSelf: 'flex-start' }}>{ORDER_STATUS_LABEL[order.status]}</span>
            <h1 className="h1">Pedido {order.code}</h1>
            <p className="lede">{STATUS_TEXT[order.status]}</p>
            <a className="btn btn-wa" style={{ alignSelf: 'flex-start' }} href={wa} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={20} /> Escribir a la tienda
            </a>
          </div>
        )}

        <div className="card pad stack rise" style={{ ['--gap' as string]: '12px', ['--i' as string]: 1 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">Pedido {order.code}</span>
            <span className="small muted">{formatDate(order.createdAt)}</span>
          </div>
          <div>
            {order.items.map((i) => (
              <div key={i.id} className="line"><span>{i.quantity} × {i.name}</span><span className="tnum">{formatPrice(i.unitPrice * i.quantity)}</span></div>
            ))}
          </div>
          <div className="total" style={{ borderTop: '1px solid var(--linea)', paddingTop: 12 }}><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
          <p className="small muted">
            {order.deliveryMethod === 'ENVIO' ? `Envío a ${order.address}, ${order.city}.` : 'Para recoger en la tienda.'} El envío y el pago se acuerdan con la tienda.
          </p>
        </div>

        <div className="row">
          <Link href={`/t/${order.store.slug}`} className="btn btn-light">Ver la tienda</Link>
          {nuevo && <Link href={`/pedido/${order.id}`} className="btn btn-ghost">Ver estado del pedido</Link>}
        </div>
        <p className="small muted">Guardá este link para consultar el estado de tu pedido.</p>
      </section>
    </div>
  )
}
