import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { EventCard } from '@/components/live/Cards'
import { EVENT_KINDS } from '@/lib/agenda'
import { listEvents } from '@/lib/live-queries'
import { SITE_OG_IMAGE } from '@/lib/seo'
import { agendaRange } from '@/lib/time'

export const metadata: Metadata = {
  title: 'Agenda 13 · Eventos en la Comuna 13',
  description: 'Música, arte, baile, talleres, deportes, ferias y gastronomía en la Comuna 13 de Medellín: hoy, mañana y el fin de semana.',
  alternates: { canonical: '/eventos' },
  openGraph: { title: 'Agenda 13 · Lo que pasa en la Comuna 13', url: '/eventos', images: [SITE_OG_IMAGE] },
}

const WHEN = [
  ['', 'Próximos'],
  ['hoy', 'Hoy'],
  ['manana', 'Mañana'],
  ['finde', 'Fin de semana'],
] as const

export default async function EventosPage({ searchParams }: { searchParams: Promise<{ cuando?: string; tipo?: string }> }) {
  const sp = await searchParams
  const cuando = WHEN.some(([k]) => k === sp.cuando) ? (sp.cuando as '' | 'hoy' | 'manana' | 'finde') : ''
  const tipo = EVENT_KINDS.some((k) => k.key === sp.tipo) ? sp.tipo! : ''
  const [from, to] = cuando ? agendaRange(cuando) : [undefined, undefined]
  const list = await listEvents({ from, to, kind: tipo || undefined })
  const href = (p: { cuando?: string; tipo?: string }) => {
    const q = new URLSearchParams({ ...(cuando && { cuando }), ...(tipo && { tipo }), ...p })
    for (const [k, v] of [...q.entries()]) if (!v) q.delete(k)
    const s = q.toString()
    return `/eventos${s ? `?${s}` : ''}`
  }

  return (
    <div className="wrap">
      <section className="stack rise" style={{ paddingTop: 28, ['--gap' as string]: '10px' }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>lo que pasa en el barrio</span>
        <h1 className="h1">Agenda 13</h1>
        <div className="seg-mini" role="tablist">
          {WHEN.map(([k, l]) => (
            <Link key={k} href={href({ cuando: k })} className={cuando === k ? 'on' : ''} role="tab" aria-selected={cuando === k}>{l}</Link>
          ))}
        </div>
        <div className="pills">
          <Link href={href({ tipo: '' })} className="pill" aria-current={!tipo ? 'true' : undefined}>Todo</Link>
          {EVENT_KINDS.filter((k) => k.key !== 'otros').map((k) => (
            <Link key={k.key} href={href({ tipo: k.key })} className="pill" aria-current={tipo === k.key ? 'true' : undefined}>
              <Icon name={k.icon} size={18} /> {k.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 12 }}>
        {list.length ? (
          <div className="stack" style={{ ['--gap' as string]: '12px' }}>{list.map((e) => <EventCard key={e.id} e={e} />)}</div>
        ) : (
          <EmptyState title="No hay eventos para esa fecha." text="Los negocios del barrio publican aquí sus eventos. ¿Tenés uno? Publicalo desde tu panel.">
            <Link href="/panel/hoy?tab=evento" className="btn btn-primary">Publicar un evento</Link>
          </EmptyState>
        )}
      </section>
    </div>
  )
}
