import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Svg } from '@/components/Svg'
import { MyImpact } from '@/components/live/FeedClient'
import { ladera } from '@/lib/art'
import { formatPrice } from '@/lib/format'
import { allTimeImpact, monthImpact } from '@/lib/impact'
import { SITE_OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Tu compra floreció aquí · Impacto',
  description: 'Cuánta plata se queda en la Comuna 13 gracias a las compras locales en Florece 13: datos reales, actualizados con cada pedido.',
  alternates: { canonical: '/impacto' },
  openGraph: { title: 'Tu compra floreció aquí · Florece 13', url: '/impacto', images: [SITE_OG_IMAGE] },
}

const ART = ladera('impacto', { w: 900, h: 220 })

export default async function ImpactoPage() {
  const [month, all] = await Promise.all([monthImpact(), allTimeImpact()])
  const monthName = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'America/Bogota' }).format(new Date())
  return (
    <div className="wrap">
      <section className="impact-hero rise">
        <span className="tag">cada compra se queda en el barrio</span>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 9vw, 84px)' }}>Tu compra <em>floreció aquí.</em></h1>
        <p className="lede">Cuando le comprás a un negocio de la 13, la plata se queda en el barrio: en una familia, un taller, una cocina. Estas cifras salen de los pedidos reales hechos en Florece 13.</p>
        <div className="impact-hero__art"><Svg html={ART} /></div>
      </section>

      <section className="sec">
        <div className="card pad stack" style={{ ['--gap' as string]: '6px' }}>
          <MyImpact />
          <p className="small muted" style={{ margin: 0 }}>
            Tu impacto se calcula con los pedidos hechos desde este celular o desde tu cuenta. <Link href="/registro?tipo=cliente" style={{ color: 'var(--verde)', fontWeight: 700 }}>Creá una cuenta</Link> para verlo en todos tus dispositivos.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="sec__head"><div><span className="tag">florece 13 en {monthName}</span><h2 className="h2">Este mes</h2></div></div>
        <div className="impact-grid">
          <div className="impact-n big"><b>{formatPrice(month.total)}</b><span>movidos dentro de la comuna</span></div>
          <div className="impact-n"><Icon name="carrito" size={22} /><b>{month.orders}</b><span>{month.orders === 1 ? 'compra local' : 'compras locales'}</span></div>
          <div className="impact-n"><Icon name="tienda" size={22} /><b>{month.stores}</b><span>{month.stores === 1 ? 'negocio beneficiado' : 'negocios beneficiados'}</span></div>
          <div className="impact-n"><Icon name="ubicacion" size={22} /><b>{month.sectors}</b><span>{month.sectors === 1 ? 'sector de la 13' : 'sectores de la 13'}</span></div>
        </div>
      </section>

      <section className="sec">
        <div className="sec__head"><div><span className="tag">desde el comienzo</span><h2 className="h2">En total</h2></div></div>
        <div className="impact-grid">
          <div className="impact-n big"><b>{formatPrice(all.total)}</b><span>que se quedaron en la 13</span></div>
          <div className="impact-n"><Icon name="carrito" size={22} /><b>{all.orders}</b><span>compras</span></div>
          <div className="impact-n"><Icon name="tienda" size={22} /><b>{all.stores}</b><span>negocios</span></div>
        </div>
        <p className="small muted" style={{ marginTop: 14 }}>Se cuentan los pedidos hechos en Florece 13 que no fueron cancelados. Lo que se acuerda solo por WhatsApp, sin pasar por el carrito, no aparece aquí.</p>
      </section>
    </div>
  )
}
