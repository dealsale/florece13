import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { DealCard } from '@/components/live/Cards'
import { NearDealsToggle } from '@/components/live/NearDealsToggle'
import { activeDeals } from '@/lib/live-queries'
import { SITE_OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Florece Flash · Ofertas de hoy',
  description: 'Ofertas que duran horas en los negocios de la Comuna 13. Cuando se acaban, se acaban.',
  alternates: { canonical: '/ofertas' },
  openGraph: { title: 'Florece Flash · Ofertas de hoy en la 13', url: '/ofertas', images: [SITE_OG_IMAGE] },
}

export default async function OfertasPage() {
  const deals = await activeDeals()
  return (
    <div className="wrap">
      <section className="flash-hero rise">
        <span className="flash-hero__bolt"><Icon name="rayo" size={34} /></span>
        <div>
          <span className="tag">cuando se acaban, se acaban</span>
          <h1 className="h1">Florece Flash</h1>
          <p className="lede">Ofertas de 1 hora, 3 horas o solo hoy en los negocios de la 13.</p>
        </div>
        <NearDealsToggle />
      </section>
      <section className="sec">
        {deals.length ? (
          <div className="grid-deals">{deals.map((d) => <DealCard key={d.id} d={d} />)}</div>
        ) : (
          <EmptyState title="Ahora mismo no hay ofertas Flash." text="Activá «Avisarme de ofertas cerca» y te llega la próxima apenas salga.">
            <Link href="/" className="btn btn-primary">Ver lo que hay hoy</Link>
          </EmptyState>
        )}
      </section>
    </div>
  )
}
