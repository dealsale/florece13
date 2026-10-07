import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { JobCard } from '@/components/live/Cards'
import { TalentForm } from '@/components/live/TalentForm'
import { getCurrentUser, getStoreForUser } from '@/lib/auth'
import { activeJobs } from '@/lib/live-queries'
import { SITE_OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Oportunidades · Empleo en la Comuna 13',
  description: 'Vacantes de los negocios de la Comuna 13 y perfiles de gente del barrio que busca trabajo.',
  alternates: { canonical: '/empleo' },
  openGraph: { title: 'Oportunidades en la 13 · Florece 13', url: '/empleo', images: [SITE_OG_IMAGE] },
}

export default async function EmpleoPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams
  const busco = ver === 'busco'
  const user = await getCurrentUser()
  const isBusiness = user?.role === 'ADMIN' || Boolean(user && (await getStoreForUser(user.id)))
  const list = busco ? [] : await activeJobs()

  return (
    <div className="wrap">
      <section className="stack rise" style={{ paddingTop: 28, ['--gap' as string]: '10px' }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>trabajo en el barrio</span>
        <h1 className="h1">Oportunidades</h1>
        <div className="seg-mini" role="tablist">
          <Link href="/empleo" className={!busco ? 'on' : ''} role="tab" aria-selected={!busco}>Vacantes</Link>
          <Link href="/empleo?ver=busco" className={busco ? 'on' : ''} role="tab" aria-selected={busco}>Busco trabajo</Link>
        </div>
      </section>

      {busco ? (
        <section className="sec two" style={{ paddingTop: 12 }}>
          <div className="stack" style={{ ['--gap' as string]: '12px' }}>
            <p className="lede" style={{ margin: 0 }}>Publicá tu perfil gratis. Solo lo ven los negocios registrados en Florece 13, y te escriben directo a tu WhatsApp.</p>
            <TalentForm />
          </div>
          <aside className="card pad stack" style={{ ['--gap' as string]: '10px' }}>
            <Icon name="maletin" size={26} />
            <h2 className="h3">¿Tenés un negocio?</h2>
            <p className="small muted" style={{ margin: 0 }}>Mirá los perfiles de la gente del barrio que está buscando trabajo.</p>
            {isBusiness ? (
              <Link href="/empleo/perfiles" className="btn btn-primary">Ver perfiles</Link>
            ) : (
              <Link href="/entrar?next=%2Fempleo%2Fperfiles" className="btn btn-outline">Entrar como negocio</Link>
            )}
          </aside>
        </section>
      ) : (
        <section className="sec" style={{ paddingTop: 12 }}>
          {list.length ? (
            <div className="grid-jobs">{list.map((j) => <JobCard key={j.id} j={j} />)}</div>
          ) : (
            <EmptyState title="Todavía no hay vacantes publicadas." text="Los negocios de la 13 publican aquí lo que necesitan. Mientras tanto, dejá tu perfil en «Busco trabajo».">
              <Link href="/empleo?ver=busco" className="btn btn-primary">Busco trabajo</Link>
            </EmptyState>
          )}
        </section>
      )}
    </div>
  )
}
