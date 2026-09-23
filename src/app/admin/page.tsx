import type { Metadata } from 'next'
import { count, desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'
import { categories, db, orders, products, stores, users } from '@/db'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'
import { logout } from '@/lib/actions/auth'
import { setStoreStatus } from '@/lib/actions/admin'
import { requireAdmin } from '@/lib/auth'
import { displayPhone, formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Administración', robots: { index: false } }

const TABS = [
  { key: 'PENDING', label: 'Por aprobar' },
  { key: 'ACTIVE', label: 'Publicadas' },
  { key: 'SUSPENDED', label: 'Suspendidas' },
] as const

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireAdmin()
  const { estado } = await searchParams
  const status = TABS.find((t) => t.key === estado)?.key ?? 'PENDING'

  const [rows, counts, [totals]] = await Promise.all([
    db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
        whatsapp: stores.whatsapp,
        sector: stores.sector,
        createdAt: stores.createdAt,
        ownerName: users.name,
        ownerEmail: users.email,
        category: categories.name,
        productCount: sql<number>`(select count(*)::int from ${products} where ${products.storeId} = ${stores.id})`,
      })
      .from(stores)
      .innerJoin(users, eq(users.id, stores.ownerId))
      .leftJoin(categories, eq(categories.id, stores.categoryId))
      .where(eq(stores.status, status))
      .orderBy(desc(stores.createdAt)),
    db.select({ status: stores.status, n: count() }).from(stores).groupBy(stores.status),
    db.select({ orders: count() }).from(orders),
  ])
  const n = (s: string) => counts.find((c) => c.status === s)?.n ?? 0

  return (
    <div className="wrap" style={{ paddingTop: 28 }}>
      <div className="phead">
        <div>
          <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>florece 13</span>
          <h1 className="h1">Administración</h1>
        </div>
        <form action={logout}><button className="btn btn-ghost">Salir</button></form>
      </div>

      <div className="kpis" style={{ marginBottom: 22 }}>
        {[
          [n('PENDING'), 'Por aprobar', 'var(--tint-naranja)', 'var(--naranja)'],
          [n('ACTIVE'), 'Publicadas', 'var(--tint-verde)', 'var(--verde)'],
          [n('SUSPENDED'), 'Suspendidas', 'var(--tint-fucsia)', 'var(--fucsia)'],
          [totals.orders, 'Pedidos totales', 'var(--tint-turquesa)', 'var(--turquesa)'],
        ].map(([v, l, c, ink], i) => (
          <div key={String(l)} className="kpi rise" style={{ ['--i' as string]: i, ['--c' as string]: c, ['--ink' as string]: ink }}><b>{v}</b><span>{l}</span></div>
        ))}
      </div>


      <div className="pills" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin?estado=${t.key}`} className="pill" aria-current={status === t.key ? 'true' : undefined}>
            {t.label} ({n(t.key)})
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No hay tiendas aquí." />
      ) : (
        <div className="list">
          {rows.map((s) => (
            <div key={s.id} className="lrow" style={{ flexWrap: 'wrap' }}>
              <Avatar name={s.name} src={s.logoUrl} size={48} />
              <div className="lrow__m" style={{ minWidth: 200 }}>
                <Link href={`/t/${s.slug}`} className="lrow__t" style={{ color: 'var(--cemento)', display: 'block' }}>{s.name}</Link>
                <div className="lrow__s">
                  {s.ownerName} · {s.ownerEmail} · {displayPhone(s.whatsapp)}
                </div>
                <div className="lrow__s">
                  {[s.category, s.sector, `${s.productCount} productos`, `desde ${formatDate(s.createdAt)}`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="row" style={{ ['--gap' as string]: '8px' }}>
                {status !== 'ACTIVE' && (
                  <form action={setStoreStatus.bind(null, s.id, 'ACTIVE')}><button type="submit" className="btn btn-primary btn-sm">Aprobar</button></form>
                )}
                <ResetPasswordButton storeId={s.id} />
                {status !== 'SUSPENDED' && (
                  <form action={setStoreStatus.bind(null, s.id, 'SUSPENDED')}><button type="submit" className="btn btn-danger btn-sm">Suspender</button></form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
