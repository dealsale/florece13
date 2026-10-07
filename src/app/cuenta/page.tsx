import type { Metadata } from 'next'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { db, orders, stores } from '@/db'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { AccountClient, ProfileForm } from '@/components/account/AccountClient'
import { MyImpact } from '@/components/live/FeedClient'
import { logout } from '@/lib/actions/auth'
import { getStoreForUser, requireUser } from '@/lib/auth'
import { formatDate, formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/lib/orders'

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false } }

export default async function CuentaPage({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const user = await requireUser('/cuenta')
  const { bienvenida } = await searchParams
  const [list, myStore] = await Promise.all([
    db
      .select({ id: orders.id, code: orders.code, total: orders.total, status: orders.status, createdAt: orders.createdAt, storeName: stores.name, storeSlug: stores.slug })
      .from(orders)
      .innerJoin(stores, eq(stores.id, orders.storeId))
      .where(eq(orders.customerUserId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(100),
    getStoreForUser(user.id),
  ])

  return (
    <div className="wrap">
      <section className="stack rise" style={{ paddingTop: 28, ['--gap' as string]: '6px' }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>mi 13</span>
        <h1 className="h1">{bienvenida ? `¡Bienvenido, ${user.name.split(' ')[0]}!` : `Hola, ${user.name.split(' ')[0]}`}</h1>
        <div className="row" style={{ ['--gap' as string]: '8px' }}>
          {myStore && <Link href="/panel" className="btn btn-light btn-sm"><Icon name="tienda" size={16} /> Ir a mi tienda</Link>}
          <form action={logout}><button type="submit" className="btn btn-ghost btn-sm"><Icon name="salir" size={16} /> Salir</button></form>
        </div>
      </section>

      <AccountClient orderIds={list.map((o) => o.id)} />

      <div className="two sec" style={{ paddingTop: 16 }}>
        <section className="stack" style={{ ['--gap' as string]: '12px' }}>
          <h2 className="h2">Mis pedidos</h2>
          {list.length === 0 ? (
            <EmptyState title="Todavía no tenés pedidos." text="Cuando pidas estando con tu cuenta, tus pedidos aparecen aquí con su estado.">
              <Link href="/" className="btn btn-primary">Ver lo que hay en la 13</Link>
            </EmptyState>
          ) : (
            <div className="list">
              {list.map((o, i) => (
                <Link key={o.id} href={`/pedido/${o.id}`} className="lrow rise" style={{ ['--i' as string]: Math.min(i, 8) }}>
                  <div className="lrow__m">
                    <div className="lrow__t">{o.storeName}</div>
                    <div className="lrow__s">{o.code} · {formatDate(o.createdAt)}</div>
                  </div>
                  <span className="price">{formatPrice(o.total)}</span>
                  <span className={`chip st-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="stack" style={{ ['--gap' as string]: '16px' }}>
          <div className="card pad stack" style={{ ['--gap' as string]: '10px' }}>
            <h2 className="h3">Tu impacto</h2>
            <MyImpact initialIds={list.map((o) => o.id)} />
            {list.length === 0 && <p className="small muted" style={{ margin: 0 }}>Cada compra en la 13 suma aquí: cuánto se quedó en el barrio y a cuántos negocios apoyaste.</p>}
          </div>
          <div className="card pad">
            <h2 className="h3" style={{ marginBottom: 12 }}>Mis datos</h2>
            <ProfileForm defaults={{ name: user.name, phone: user.phone.startsWith('57') && user.phone.length === 12 ? user.phone.slice(2) : user.phone, city: user.city, address: user.address, email: user.email }} />
          </div>
        </aside>
      </div>
    </div>
  )
}
