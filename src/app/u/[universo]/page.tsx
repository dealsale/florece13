import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { getCategoryUsage, listProducts, listStores } from '@/lib/queries'
import { SITE_OG_IMAGE } from '@/lib/seo'
import { CATEGORY_UNIVERSES, universe as findUniverse } from '@/lib/universes'

type Params = Promise<{ universo: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const u = findUniverse((await params).universo)
  if (!u || !CATEGORY_UNIVERSES.includes(u)) return { title: 'Florece 13' }
  return {
    title: `${u.name} en la Comuna 13`,
    description: `${u.blurb}. Negocios de la Comuna 13 de Medellín en Florece 13.`,
    alternates: { canonical: u.href },
    openGraph: { title: `${u.name} en la Comuna 13 · Florece 13`, url: u.href, images: [SITE_OG_IMAGE] },
  }
}

const NEED: Record<string, string> = {
  barberias: 'barbero',
  belleza: 'peluquería',
  unas: 'manicurista',
  tatuajes: 'tatuador',
  fotografia: 'fotógrafo',
  diseno: 'diseñador',
  programacion: 'programador',
  tecnicos: 'técnico',
  electricistas: 'electricista',
  mecanicos: 'mecánico',
  clases: 'profesor',
  limpieza: 'limpieza',
  dj: 'DJ',
  domicilios: 'domiciliario',
  eventos: 'organizador de eventos',
  servicios: 'otro servicio',
}

export default async function UniversePage({ params }: { params: Params }) {
  const u = findUniverse((await params).universo)
  if (!u || !CATEGORY_UNIVERSES.includes(u)) notFound()
  const [usage, stores, items] = await Promise.all([getCategoryUsage(), listStores({ universe: u.key, limit: 24 }), listProducts({ universe: u.key, limit: 12 })])
  const cats = usage.filter((c) => c.universe === u.key)
  const used = cats.filter((c) => c.products > 0 || c.stores > 0)
  const services = u.key === 'servicios'

  return (
    <div className="wrap">
      <section className="uni-hero rise" style={{ ['--u' as string]: u.color, ['--ut' as string]: u.tint }}>
        <span className="uni-hero__ic"><Icon name={u.icon} size={30} /></span>
        <div>
          <span className="tag">en la 13</span>
          <h1 className="h1">{u.name}</h1>
          <p className="lede">{u.blurb}</p>
        </div>
      </section>

      {services ? (
        <section className="sec">
          <div className="sec__head"><div><span className="tag">talento local</span><h2 className="h2">¿Qué necesitás?</h2></div></div>
          <div className="need">
            {cats.map((c, i) => (
              <Link key={c.id} href={`/tiendas?cat=${c.slug}`} className={`need__it rise${c.stores ? '' : ' none'}`} style={{ ['--i' as string]: Math.min(i, 12) }}>
                <span className="need__ic"><Icon name={c.icon} size={22} /></span>
                <span className="need__t">
                  <small>Necesito</small>
                  <b>{NEED[c.slug] ?? c.name.toLowerCase()}</b>
                </span>
                <span className="need__n">{c.stores ? `${c.stores} ${c.stores === 1 ? 'disponible' : 'disponibles'}` : 'Pronto'}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        used.length > 0 && (
          <div className="pills" style={{ marginTop: 18 }}>
            {used.map((c) => (
              <Link key={c.id} href={`/buscar?cat=${c.slug}`} className="pill">
                <Icon name={c.icon} size={18} /> {c.name}
              </Link>
            ))}
          </div>
        )
      )}

      <section className="sec">
        <div className="sec__head"><div><span className="tag">del barrio</span><h2 className="h2">{services ? 'Quién lo hace' : 'Negocios'}</h2></div></div>
        {stores.length ? (
          <div className="grid-stores">{stores.map((s, i) => <StoreCard key={s.id} store={s} i={i} />)}</div>
        ) : (
          <EmptyState title="Todavía no hay negocios aquí." text="¿Tenés uno en la 13? Publicalo gratis.">
            <Link href="/vende" className="btn btn-primary">Abrí tu tienda</Link>
          </EmptyState>
        )}
      </section>

      {items.length > 0 && (
        <section className="sec">
          <div className="sec__head"><div><span className="tag">para pedir</span><h2 className="h2">{services ? 'Servicios' : u.key === 'experiencias' ? 'Para vivir' : 'Lo nuevo'}</h2></div></div>
          <div className="grid-prods">{items.map((p, i) => <ProductCard key={p.id} product={p} i={i} />)}</div>
        </section>
      )}
    </div>
  )
}
