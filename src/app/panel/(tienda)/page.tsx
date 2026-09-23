import type { Metadata } from 'next'
import { and, count, desc, eq, gte, ne, sql } from 'drizzle-orm'
import Link from 'next/link'
import { db, orders, products } from '@/db'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { requireMerchant } from '@/lib/auth'
import { formatDate, formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/lib/orders'

export const metadata: Metadata = { title: 'Mi tienda' }

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const { user, store } = await requireMerchant()
  const { bienvenida } = await searchParams
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [[prod], [nuevos], [mes], recent] = await Promise.all([
    db
      .select({ total: count(), withPhoto: sql<number>`count(*) filter (where exists (select 1 from product_images pi where pi.product_id = ${products.id}))::int` })
      .from(products)
      .where(eq(products.storeId, store.id)),
    db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, 'NUEVO'))),
    db
      .select({ n: count(), sum: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
      .from(orders)
      .where(and(eq(orders.storeId, store.id), gte(orders.createdAt, monthStart), ne(orders.status, 'CANCELADO'))),
    db.select().from(orders).where(eq(orders.storeId, store.id)).orderBy(desc(orders.createdAt)).limit(5),
  ])

  const checklist = [
    { done: Boolean(store.logoUrl), label: 'Subí el logo o una foto tuya', href: '/panel/tienda' },
    { done: Boolean(store.coverUrl), label: 'Poné una portada: tu local, tu taller, tu muro', href: '/panel/tienda' },
    { done: store.story.length > 40, label: 'Contá la historia de tu negocio', href: '/panel/tienda' },
    { done: prod.total > 0, label: 'Publicá tu primer producto', href: '/panel/productos/nuevo' },
    { done: prod.total >= 5, label: 'Llegá a 5 productos publicados', href: '/panel/productos/nuevo' },
  ]
  const pending = checklist.filter((c) => !c.done)

  return (
    <div className="stack" style={{ ['--gap' as string]: '24px' }}>
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="label-muted">{store.name}</p>
          <h1 className="title">{bienvenida ? '¡Bienvenido a Florece 13!' : `Hola, ${user.name.split(' ')[0]}`}</h1>
        </div>
        <Link href="/panel/productos/nuevo" className="btn btn-primary"><Icon name="mas" size={18} /> Publicar producto</Link>
      </div>

      {store.status === 'PENDING' && (
        <div className="alert alert-info">
          <strong>Tu tienda está en revisión.</strong> Confirmamos que sea de la Comuna 13 y la publicamos. Mientras tanto, subí tus
          productos: van a aparecer apenas se apruebe.
        </div>
      )}
      {store.status === 'SUSPENDED' && (
        <div className="alert alert-error">Tu tienda está suspendida y no aparece al público. Escribinos para revisarlo.</div>
      )}

      <div className="stats">
        <div className="stat"><div className="stat__value">{nuevos.n}</div><div className="stat__label">Pedidos nuevos</div></div>
        <div className="stat"><div className="stat__value">{mes.n}</div><div className="stat__label">Pedidos este mes</div></div>
        <div className="stat"><div className="stat__value" style={{ fontSize: 24 }}>{formatPrice(mes.sum)}</div><div className="stat__label">Vendido este mes</div></div>
        <div className="stat"><div className="stat__value">{prod.total}</div><div className="stat__label">Productos</div></div>
      </div>

      {pending.length > 0 && (
        <section className="card card-pad stack" style={{ ['--gap' as string]: '12px' }}>
          <h2 className="subtitle">Hacé florecer tu tienda</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="row" style={{ color: c.done ? 'var(--texto-3)' : 'var(--cemento)', padding: '8px 0', flexWrap: 'nowrap', ['--gap' as string]: '10px', textDecoration: c.done ? 'line-through' : undefined }}>
                  <span style={{ width: 24, height: 24, flexShrink: 0, display: 'grid', placeItems: 'center', background: c.done ? 'var(--verde-florece)' : 'var(--hueso)', border: c.done ? 0 : '1.5px solid var(--linea-2)', color: '#10301E' }}>
                    {c.done && <Icon name="check" size={16} />}
                  </span>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2 className="subtitle">Últimos pedidos</h2>
          {recent.length > 0 && <Link href="/panel/pedidos" className="small" style={{ fontWeight: 700 }}>Ver todos</Link>}
        </div>
        {recent.length > 0 ? (
          <div className="list">
            {recent.map((o) => (
              <Link key={o.id} href={`/panel/pedidos/${o.id}`} className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{o.customerName}</div>
                  <div className="list-row__sub">{o.code} · {formatDate(o.createdAt)}</div>
                </div>
                <span className="price tnum">{formatPrice(o.total)}</span>
                <span className={`chip status-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="pedidos" title="Aquí van a llegar tus pedidos." text="Cuando alguien te pida desde Florece 13, lo ves aquí y te llega a tu WhatsApp." />
        )}
      </section>
    </div>
  )
}
