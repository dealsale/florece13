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
    db.select({ total: count() }).from(products).where(eq(products.storeId, store.id)),
    db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, 'NUEVO'))),
    db
      .select({ n: count(), sum: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
      .from(orders)
      .where(and(eq(orders.storeId, store.id), gte(orders.createdAt, monthStart), ne(orders.status, 'CANCELADO'))),
    db.select().from(orders).where(eq(orders.storeId, store.id)).orderBy(desc(orders.createdAt)).limit(5),
  ])

  const todo = [
    { done: Boolean(store.logoUrl), label: 'Subí el logo o una foto tuya', href: '/panel/tienda' },
    { done: Boolean(store.coverUrl), label: 'Poné una portada: tu local, tu taller, tu muro', href: '/panel/tienda' },
    { done: store.story.length > 40, label: 'Contá la historia de tu negocio', href: '/panel/tienda' },
    { done: prod.total > 0, label: 'Publicá tu primer producto', href: '/panel/productos/nuevo' },
    { done: prod.total >= 5, label: 'Llegá a 5 productos publicados', href: '/panel/productos/nuevo' },
  ]
  const doneN = todo.filter((t) => t.done).length
  const kpis = [
    { v: nuevos.n, l: 'Pedidos nuevos', c: 'var(--tint-naranja)', ink: 'var(--naranja)' },
    { v: mes.n, l: 'Pedidos del mes', c: 'var(--tint-turquesa)', ink: 'var(--turquesa)' },
    { v: formatPrice(mes.sum), l: 'Vendido este mes', c: 'var(--tint-verde)', ink: 'var(--verde)' },
    { v: prod.total, l: 'Productos', c: 'var(--tint-fucsia)', ink: 'var(--fucsia)' },
  ]

  return (
    <div className="stack" style={{ ['--gap' as string]: '24px' }}>
      <div className="phead" style={{ marginBottom: 0 }}>
        <div className="rise">
          <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>{store.name}</span>
          <h1 className="h1">{bienvenida ? '¡Bienvenido a Florece 13!' : `Hola, ${user.name.split(' ')[0]}`}</h1>
        </div>
        <Link href="/panel/productos/nuevo" className="btn btn-primary"><Icon name="mas" size={18} /> Publicar producto</Link>
      </div>

      {store.status === 'PENDING' && (
        <div className="note note-info rise">
          <Icon name="escudo" size={20} />
          <span><b>Tu tienda está en revisión.</b> Confirmamos que sea de la Comuna 13 y la publicamos. Mientras tanto, subí tus productos: van a aparecer apenas se apruebe.</span>
        </div>
      )}
      {store.status === 'SUSPENDED' && <div className="note note-err">Tu tienda está suspendida y no aparece al público. Escribinos para revisarlo.</div>}

      <div className="kpis">
        {kpis.map((k, i) => (
          <div key={k.l} className="kpi rise" style={{ ['--i' as string]: i, ['--c' as string]: k.c, ['--ink' as string]: k.ink }}>
            <b style={String(k.v).length > 7 ? { fontSize: 24 } : undefined}>{k.v}</b>
            <span>{k.l}</span>
          </div>
        ))}
      </div>

      {doneN < todo.length && (
        <section className="card pad stack rise" style={{ ['--gap' as string]: '14px' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 className="h3">Hacé florecer tu tienda</h2>
            <span className="small muted">{doneN} de {todo.length}</span>
          </div>
          <div className="prog"><i style={{ width: `${(doneN / todo.length) * 100}%` }} /></div>
          <ul className="todo">
            {todo.map((t) => (
              <li key={t.label} className={t.done ? 'ok' : undefined}>
                <Link href={t.href}><span className="bx">{t.done && <Icon name="check" size={15} />}</span><span>{t.label}</span></Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="sec__head" style={{ marginBottom: 12 }}>
          <h2 className="h3">Últimos pedidos</h2>
          {recent.length > 0 && <Link href="/panel/pedidos" className="more">Ver todos</Link>}
        </div>
        {recent.length > 0 ? (
          <div className="list">
            {recent.map((o, i) => (
              <Link key={o.id} href={`/panel/pedidos/${o.id}`} className="lrow rise" style={{ ['--i' as string]: i }}>
                <div className="lrow__m">
                  <div className="lrow__t">{o.customerName}</div>
                  <div className="lrow__s">{o.code} · {formatDate(o.createdAt)}</div>
                </div>
                <span className="price">{formatPrice(o.total)}</span>
                <span className={`chip st-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Aquí van a llegar tus pedidos." text="Cuando alguien te pida desde Florece 13, lo ves aquí y te llega a tu WhatsApp." />
        )}
      </section>
    </div>
  )
}
