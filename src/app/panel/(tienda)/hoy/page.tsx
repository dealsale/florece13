import type { Metadata } from 'next'
import { and, asc, desc, eq, gt } from 'drizzle-orm'
import { db, deals, events, jobs, stories } from '@/db'
import { Icon } from '@/components/Icon'
import { LiveForms } from '@/components/panel/LiveForms'
import { removeLive } from '@/lib/actions/live'
import { eventKind } from '@/lib/agenda'
import { requireMerchant } from '@/lib/auth'
import { formatPrice } from '@/lib/format'
import { timeLeft, whenLabel } from '@/lib/time'

export const metadata: Metadata = { title: 'Hoy' }

export default async function HoyPanelPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { store } = await requireMerchant('/panel/hoy')
  const { tab } = await searchParams
  const now = new Date()
  const [myStories, myDeals, myEvents, myJobs] = await Promise.all([
    db.select().from(stories).where(and(eq(stories.storeId, store.id), gt(stories.expiresAt, now))).orderBy(desc(stories.createdAt)),
    db.select().from(deals).where(and(eq(deals.storeId, store.id), gt(deals.endsAt, now))).orderBy(asc(deals.endsAt)),
    db.select().from(events).where(and(eq(events.storeId, store.id), gt(events.startsAt, new Date(now.getTime() - 6 * 3600_000)))).orderBy(asc(events.startsAt)),
    db.select().from(jobs).where(and(eq(jobs.storeId, store.id), gt(jobs.expiresAt, now))).orderBy(desc(jobs.createdAt)),
  ])
  const live = [
    ...myStories.map((s) => ({ kind: 'story' as const, id: s.id, icon: 'camara', title: s.caption || (s.mediaType === 'video' ? 'Video' : 'Foto'), sub: `Historia · ${timeLeft(s.expiresAt, now)}`, thumb: s.mediaType === 'image' ? s.mediaUrl : null })),
    ...myDeals.map((d) => ({ kind: 'deal' as const, id: d.id, icon: 'rayo', title: d.title, sub: `Flash · ${formatPrice(d.price)} · ${timeLeft(d.endsAt, now)}`, thumb: d.imageUrl })),
    ...myEvents.map((e) => ({ kind: 'event' as const, id: e.id, icon: eventKind(e.category).icon, title: e.title, sub: `${eventKind(e.category).name} · ${whenLabel(e.startsAt, now)}`, thumb: e.imageUrl })),
    ...myJobs.map((j) => ({ kind: 'job' as const, id: j.id, icon: 'maletin', title: j.title, sub: `Vacante · ${j.schedule}`, thumb: null })),
  ]
  const initial = tab === 'flash' || tab === 'evento' || tab === 'empleo' ? tab : 'historia'

  return (
    <div className="stack" style={{ ['--gap' as string]: '20px' }}>
      <div className="phead" style={{ marginBottom: 0 }}>
        <div>
          <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 18 }}>lo que pasa hoy</span>
          <h1 className="h1">Publicar</h1>
        </div>
      </div>
      <LiveForms defaultPlace={store.address} initial={initial} />

      <section className="stack" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="h3">Al aire ahora</h2>
        {live.length === 0 ? (
          <p className="muted small">Nada publicado todavía. Una historia de hoy o un Flash hacen que la gente te vuelva a mirar.</p>
        ) : (
          <div className="list">
            {live.map((l) => (
              <div key={l.kind + l.id} className="lrow">
                <span className="lrow__th">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.thumb ? <img src={l.thumb} alt="" /> : <span className="no-photo"><Icon name={l.icon} /></span>}
                </span>
                <div className="lrow__m">
                  <div className="lrow__t">{l.title}</div>
                  <div className="lrow__s">{l.sub}</div>
                </div>
                <form action={removeLive.bind(null, l.kind, l.id)}>
                  <button type="submit" className="icon-btn" aria-label="Quitar"><Icon name="basura" size={18} /></button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
