import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { Svg } from '@/components/Svg'
import { DealCard } from '@/components/live/Cards'
import { Countdown } from '@/components/live/Countdown'
import { FollowedFeed, MyImpact, NearbyNow } from '@/components/live/FeedClient'
import { StoriesBar } from '@/components/live/Stories'
import { getStoreForUser, getCurrentUser } from '@/lib/auth'
import { ladera, stairs } from '@/lib/art'
import { eventKind } from '@/lib/agenda'
import { mostOrdered, neighborhoodStories, newCollections, servicesAvailable } from '@/lib/feed'
import { formatPrice } from '@/lib/format'
import { monthImpact } from '@/lib/impact'
import { activeDeals, activeStories, listEvents } from '@/lib/live-queries'
import { getMapStores, listStores } from '@/lib/queries'
import { agendaRange, hourLabel } from '@/lib/time'
import { UNIVERSES } from '@/lib/universes'
import { appUrl } from '@/lib/url'

const HERO_ART = ladera('florece-hero', { w: 1400, h: 300, anim: true, flowerAt: [1180, 40, 1.6] })
const BAND_ART = ladera('banda', { w: 500, h: 260 })
const CTA_ART = stairs('#2ECC71', 6)

/**
 * "Mi 13": el inicio es un feed vivo. Historias, lo que pasa hoy, lo que tenés cerca,
 * lo que seguís, lo más pedido… Cada sección aparece solo si tiene algo real que mostrar.
 */
export default async function HomePage({ searchParams }: { searchParams: Promise<{ historia?: string }> }) {
  const { historia } = await searchParams
  const user = await getCurrentUser()
  const [hoyFrom, hoyTo] = agendaRange('hoy')
  const [storiesG, deals, eventsToday, collections, mapStores, newStores, top, services, quotes, impact, myStore] = await Promise.all([
    activeStories(),
    activeDeals(12),
    listEvents({ from: hoyFrom, to: hoyTo, limit: 8 }),
    newCollections(),
    getMapStores(),
    listStores({ limit: 8 }),
    mostOrdered(8),
    servicesAvailable(8),
    neighborhoodStories(),
    monthImpact(),
    user ? getStoreForUser(user.id) : null,
  ])

  // "Hoy en la 13": ofertas, eventos de hoy y colecciones nuevas, en una sola tira.
  const today = [
    ...deals.slice(0, 4).map((d) => ({ key: `d${d.id}`, href: `/ofertas#${d.id}`, icon: 'rayo', hot: true, title: d.title, sub: <>{formatPrice(d.price)} · <Countdown endsAt={d.endsAt.toISOString()} /></>, who: d.storeName })),
    ...eventsToday.map((e) => ({ key: `e${e.id}`, href: `/eventos#${e.id}`, icon: eventKind(e.category).icon, hot: false, title: e.title, sub: <>{hourLabel(e.startsAt)} · {e.price ? formatPrice(e.price) : 'Entrada libre'}</>, who: e.storeName })),
    ...collections.map((c) => ({ key: `c${c.slug}`, href: `/t/${c.slug}`, icon: 'florece', hot: false, title: `Nueva colección de ${c.name}`, sub: <>{c.n} cosas nuevas</>, who: c.name })),
  ]
  const fresh = newStores

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Florece 13',
        url: appUrl('/'),
        inLanguage: 'es-CO',
        potentialAction: { '@type': 'SearchAction', target: `${appUrl('/buscar')}?q={q}`, 'query-input': 'required name=q' },
      },
      {
        '@type': 'Organization',
        name: 'Florece 13',
        url: appUrl('/'),
        logo: appUrl('/brand/logo.png'),
        slogan: 'Tu negocio florece aquí.',
        areaServed: 'CO',
        description: 'La economía local de la Comuna 13 de Medellín: comprar, comer, servicios, experiencias, ofertas, eventos y empleo.',
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="hero hero--feed">
        <div className="wrap hero__in">
          <span className="tag hero__tag rise">mi 13</span>
          <h1 className="display rise" style={{ ['--i' as string]: 1 }}>Todo lo que <em>florece en la 13.</em></h1>
          <form action="/buscar" className="search rise" style={{ ['--i' as string]: 2 }} role="search">
            <Icon name="buscar" size={20} />
            <label htmlFor="q-home" className="vh">Buscar</label>
            <input id="q-home" name="q" placeholder="Arepas, barbería, tour, camisetas…" autoComplete="off" style={{ marginLeft: 10 }} />
            <button className="btn btn-primary" type="submit">Buscar</button>
          </form>
        </div>
        <div className="hero__art"><Svg html={HERO_ART} /></div>
      </section>

      <div className="wrap">
        {storiesG.length > 0 && (
          <section className="sec sec-tight">
            <div className="sec__head"><div><span className="tag">últimas 24 horas</span><h2 className="h3">Historias de la 13</h2></div></div>
            <StoriesBar groups={storiesG} openSlug={historia} />
          </section>
        )}

        <section className="sec sec-tight">
          <div className="unis">
            {UNIVERSES.map((u, i) => (
              <Link key={u.key} href={u.href} className="uni rise" style={{ ['--i' as string]: i, ['--u' as string]: u.color, ['--ut' as string]: u.tint }}>
                <span className="uni__ic"><Icon name={u.icon} size={24} /></span>
                <b>{u.name}</b>
              </Link>
            ))}
          </div>
        </section>

        {today.length > 0 && (
          <section className="sec">
            <div className="sec__head">
              <div><span className="tag">esto está pasando</span><h2 className="h2">Hoy en la 13</h2></div>
              <Link href="/eventos?cuando=hoy" className="more">Agenda <Icon name="flecha" size={16} /></Link>
            </div>
            <div className="today">
              {today.map((t) => (
                <Link key={t.key} href={t.href} className={`today__it${t.hot ? ' hot' : ''}`}>
                  <span className="today__ic"><Icon name={t.icon} size={18} /></span>
                  <span><b>{t.title}</b><small>{t.sub} · {t.who}</small></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <NearbyNow stores={mapStores} />

        {deals.length > 0 && (
          <section className="sec">
            <div className="sec__head">
              <div><span className="tag">cuando se acaban, se acaban</span><h2 className="h2"><Icon name="rayo" size={26} /> Florece Flash</h2></div>
              <Link href="/ofertas" className="more">Ver todas <Icon name="flecha" size={16} /></Link>
            </div>
            <div className="rail rail-deals">{deals.map((d) => <DealCard key={d.id} d={d} compact />)}</div>
          </section>
        )}

        <FollowedFeed />

        {top.length > 0 && (
          <section className="sec">
            <div className="sec__head"><div><span className="tag">lo que el barrio está pidiendo</span><h2 className="h2">Lo más pedido</h2></div></div>
            <div className="rail rail-prods">{top.map((p, i) => <ProductCard key={p.id} product={p} i={i} />)}</div>
          </section>
        )}

        <section className="sec">
          <div className="sec__head">
            <div><span className="tag">recién llegados</span><h2 className="h2">Nuevos negocios</h2></div>
            {fresh.length > 0 && <Link href="/tiendas" className="more">Ver todos <Icon name="flecha" size={16} /></Link>}
          </div>
          {fresh.length > 0 ? (
            <div className="rail">{fresh.map((s, i) => <StoreCard key={s.id} store={s} i={i} />)}</div>
          ) : (
            <EmptyState title="Aquí van a florecer los negocios del barrio." text="¿Tenés un negocio en la 13? Sé de los primeros.">
              <Link href="/vende" className="btn btn-primary">Abrí tu tienda</Link>
            </EmptyState>
          )}
        </section>

        {services.length > 0 && (
          <section className="sec">
            <div className="sec__head">
              <div><span className="tag">abiertos ahora</span><h2 className="h2">Servicios disponibles</h2></div>
              <Link href="/u/servicios" className="more">¿Qué necesitás? <Icon name="flecha" size={16} /></Link>
            </div>
            <div className="rail rail-prods">{services.map((p, i) => <ProductCard key={p.id} product={p} i={i} />)}</div>
          </section>
        )}

        {quotes.length > 0 && (
          <section className="sec">
            <div className="sec__head"><div><span className="tag">gente de a pie con orgullo</span><h2 className="h2">Historias del barrio</h2></div></div>
            <div className="quotes">
              {quotes.map((q, i) => (
                <Link key={q.slug} href={`/t/${q.slug}`} className="quote rise" style={{ ['--i' as string]: i }}>
                  <p>“{q.quote}”</p>
                  <span>{q.name}{q.sector ? ` · ${q.sector}` : ''}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="sec">
          <div className="story-band rise">
            <span className="tag">cada compra se queda en el barrio</span>
            <h2 className="h1">Tu compra floreció aquí.</h2>
            <MyImpact />
            {impact.orders > 0 ? (
              <>
                <p>Este mes, en Florece 13:</p>
                <div className="stats">
                  <div><b>{formatPrice(impact.total)}</b><span>movidos dentro de la comuna</span></div>
                  <div><b>{impact.orders}</b><span>{impact.orders === 1 ? 'compra local' : 'compras locales'}</span></div>
                  <div><b>{impact.stores}</b><span>{impact.stores === 1 ? 'negocio beneficiado' : 'negocios beneficiados'}</span></div>
                </div>
              </>
            ) : (
              <p>Sin intermediarios: pedís, le escribís directo a quien lo hace y acuerdan el pago. Lo que pagás se queda en la 13.</p>
            )}
            <Link href="/impacto" className="btn btn-light btn-sm" style={{ alignSelf: 'flex-start' }}>Ver el impacto <Icon name="flecha" size={16} /></Link>
            <div className="story-band__art"><Svg html={BAND_ART} /></div>
          </div>
        </section>

        <section className="sec">
          <div className="cta rise">
            <span className="tag">¿tenés un negocio en la 13?</span>
            <h2 className="h1" style={{ maxWidth: '14ch' }}>Tu negocio también florece.</h2>
            <p>Productos, comida, servicios o experiencias: publicá gratis, recibí pedidos en tu WhatsApp, lanzá ofertas Flash y aparecé en el mapa del barrio.</p>
            <div className="row">
              <Link href="/vende" className="btn btn-primary btn-lg">Quiero vender</Link>
              <Link href={myStore ? '/panel' : '/entrar'} className="btn btn-ghost" style={{ ['--fg' as string]: 'var(--hueso)' }}>
                {myStore ? 'Ir a mi tienda' : 'Ya tengo tienda'}
              </Link>
            </div>
            <div className="cta__steps"><Svg html={CTA_ART} /></div>
          </div>
        </section>
      </div>
    </>
  )
}
