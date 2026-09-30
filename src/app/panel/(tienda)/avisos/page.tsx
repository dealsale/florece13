import type { Metadata } from 'next'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { db, notifications } from '@/db'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { MarkRead } from '@/components/panel/MarkRead'
import { PushSettings } from '@/components/panel/PushToggle'
import { requireMerchant } from '@/lib/auth'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Avisos' }

const ICON: Record<string, string> = { pedido: 'pedidos', tienda: 'tienda', admin: 'escudo', prueba: 'campana' }

export default async function AvisosPage() {
  const { user } = await requireMerchant('/panel/avisos')
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(60)
  const unread = rows.filter((r) => !r.readAt).length

  return (
    <div className="stack" style={{ ['--gap' as string]: '20px' }}>
      <div className="phead" style={{ marginBottom: 0 }}>
        <h1 className="h1">Avisos</h1>
      </div>
      <PushSettings />
      {rows.length === 0 ? (
        <EmptyState title="Todavía no tenés avisos." text="Aquí vas a ver cada pedido nuevo y las novedades de tu tienda." />
      ) : (
        <div className="list">
          {rows.map((r, i) => (
            <Link key={r.id} href={r.url} className={`lrow notif rise${r.readAt ? '' : ' unread'}`} style={{ ['--i' as string]: Math.min(i, 8) }}>
              <span className="notif__ic" aria-hidden="true">
                <Icon name={ICON[r.kind] ?? 'campana'} size={20} />
              </span>
              <div className="lrow__m">
                <div className="notif__t">{r.title}</div>
                {r.body && <div className="lrow__s">{r.body}</div>}
                <div className="notif__d">{formatDate(r.createdAt)}</div>
              </div>
              {!r.readAt && <span className="notif__dot" aria-label="Sin leer" />}
            </Link>
          ))}
        </div>
      )}
      {unread > 0 && <MarkRead />}
    </div>
  )
}
