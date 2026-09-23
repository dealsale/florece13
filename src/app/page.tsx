import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { Svg } from '@/components/Svg'
import { getStoreForUser, getCurrentUser } from '@/lib/auth'
import { ladera, stairs } from '@/lib/art'
import { getCategories, getHomeStats, listProducts, listStores } from '@/lib/queries'

const WORDS = ['Mochilas tejidas', 'Café de la loma', 'Serigrafía', 'Streetwear', 'Obleas', 'Arte de muro', 'Recuerdos', 'Hecho en la 13']
const HERO_ART = ladera('florece-hero', { w: 1400, h: 300, anim: true, flowerAt: [1180, 40, 1.6] })
const BAND_ART = ladera('banda', { w: 500, h: 260 })
const CTA_ART = stairs('#2ECC71', 6)

export default async function HomePage() {
  const user = await getCurrentUser()
  const [categories, stores, products, stats, myStore] = await Promise.all([
    getCategories(),
    listStores({ limit: 8 }),
    listProducts({ limit: 9 }),
    getHomeStats(),
    user ? getStoreForUser(user.id) : null,
  ])

  return (
    <>
      <section className="hero">
        <div className="wrap hero__in">
          <span className="tag hero__tag rise">¡hecho en la 13!</span>
          <h1 className="display rise" style={{ ['--i' as string]: 1 }}>Del barrio, para <em>todo el país.</em></h1>
          <p className="hero__claim rise" style={{ ['--i' as string]: 2 }}>Artesanías, ropa, arte y sabores de la Comuna 13, directo de quienes los hacen.</p>
          <form action="/buscar" className="search rise" style={{ ['--i' as string]: 3 }} role="search">
            <Icon name="buscar" size={20} />
            <label htmlFor="q-home" className="vh">Buscar</label>
            <input id="q-home" name="q" placeholder="Buscá mochilas, camisetas, café…" autoComplete="off" style={{ marginLeft: 10 }} />
            <button className="btn btn-primary" type="submit">Buscar</button>
          </form>
        </div>
        <div className="hero__art"><Svg html={HERO_ART} /></div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[0, 1].map((k) => (
            <span key={k}>{WORDS.map((w) => <span key={w}>{w}<i /></span>)}</span>
          ))}
        </div>
      </div>

      <div className="wrap">
        <section className="sec">
          <div className="sec__head"><div><span className="tag">explorá</span><h2 className="h2">¿Qué te antoja hoy?</h2></div></div>
          <div className="cats">
            {categories.map((c, i) => {
              const n = stats.perCategory[c.slug] ?? 0
              return (
                <Link key={c.id} href={`/buscar?cat=${c.slug}`} className="cat rise" data-k={i} style={{ ['--i' as string]: i }}>
                  <span className="cat__ic"><Icon name={c.icon} size={24} /></span>
                  <span><b>{c.name}</b><br /><small>{n} {n === 1 ? 'producto' : 'productos'}</small></span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="sec">
          <div className="sec__head">
            <div><span className="tag">conocé</span><h2 className="h2">Tiendas del barrio</h2></div>
            {stores.length > 0 && <Link href="/tiendas" className="more">Ver todas <Icon name="flecha" size={16} /></Link>}
          </div>
          {stores.length > 0 ? (
            <div className="rail">{stores.map((s, i) => <StoreCard key={s.id} store={s} i={i} />)}</div>
          ) : (
            <EmptyState title="Aquí van a florecer las tiendas del barrio." text="Estamos abriendo las primeras tiendas de la Comuna 13. ¿Tenés un negocio en la 13? Sé de los primeros.">
              <Link href="/vende" className="btn btn-primary">Abrí tu tienda</Link>
            </EmptyState>
          )}
        </section>

        {products.length > 0 && (
          <section className="sec">
            <div className="sec__head">
              <div><span className="tag">recién florecido</span><h2 className="h2">Lo último de la 13</h2></div>
              <Link href="/buscar" className="more">Ver todo <Icon name="flecha" size={16} /></Link>
            </div>
            <div className={`grid-prods ${products.length >= 5 ? "feature" : ""}`}>{products.map((p, i) => <ProductCard key={p.id} product={p} i={i} />)}</div>
          </section>
        )}

        <section className="sec">
          <div className="story-band rise">
            <span className="tag">cada compra se queda en el barrio</span>
            <h2 className="h1">Detrás de cada producto hay un vecino con nombre propio.</h2>
            <p>Sin intermediarios: pedís, le escribís directo a quien lo hace y acuerdan el pago. Lo que pagás florece aquí.</p>
            <div className="stats">
              <div><b>{stats.stores}</b><span>tiendas</span></div>
              <div><b>{stats.products}</b><span>productos</span></div>
              <div><b>{stats.sectors}</b><span>sectores de la 13</span></div>
            </div>
            <div className="story-band__art"><Svg html={BAND_ART} /></div>
          </div>
        </section>

        <section className="sec">
          <div className="cta rise">
            <span className="tag">¿vendés en la 13?</span>
            <h2 className="h1" style={{ maxWidth: '14ch' }}>Tu negocio también florece.</h2>
            <p>Abrí tu tienda en línea: subí tus productos con foto y precio, y recibí los pedidos directo en tu WhatsApp. Sin mensualidad para empezar.</p>
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
