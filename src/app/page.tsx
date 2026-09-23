import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { getCategories, listProducts, listStores } from '@/lib/queries'

export default async function HomePage() {
  const [categories, stores, products] = await Promise.all([
    getCategories(),
    listStores({ limit: 6 }),
    listProducts({ limit: 8 }),
  ])

  return (
    <>
      <section className="container hero">
        <span className="chip">Comuna 13 · Medellín</span>
        <h1 className="display" style={{ marginTop: 18 }}>
          Del barrio,<br />para todo el país.
        </h1>
        <p className="hero__claim">Artesanías, ropa, arte y sabores de la 13, directo de quienes los hacen.</p>
        <form action="/buscar" className="hero__search" role="search">
          <label htmlFor="q" className="visually-hidden">Buscar productos o tiendas</label>
          <input id="q" name="q" className="input" placeholder="Buscá mochilas, camisetas, café…" autoComplete="off" />
          <button className="btn btn-dark" type="submit" aria-label="Buscar"><Icon name="buscar" /></button>
        </form>
      </section>

      <div className="mural-band" aria-hidden="true" />

      <div className="container">
        <section className="section" aria-labelledby="cats">
          <h2 id="cats" className="visually-hidden">Categorías</h2>
          <div className="cat-scroller">
            {categories.map((c) => (
              <Link key={c.id} href={`/buscar?cat=${c.slug}`} className="cat-pill">
                <Icon name={c.icon} size={20} /> {c.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="tiendas">
          <div className="section-head">
            <h2 id="tiendas" className="title">Tiendas de la 13</h2>
            {stores.length > 0 && <Link href="/tiendas" className="small" style={{ fontWeight: 700 }}>Ver todas</Link>}
          </div>
          {stores.length > 0 ? (
            <div className="store-grid">
              {stores.map((s) => <StoreCard key={s.id} store={s} />)}
            </div>
          ) : (
            <EmptyState
              icon="tienda"
              title="Aquí van a florecer las tiendas del barrio."
              text="Estamos abriendo las primeras tiendas de la Comuna 13. ¿Tenés un negocio en la 13? Sé de los primeros."
            >
              <Link href="/vende" className="btn btn-primary">Abrí tu tienda</Link>
            </EmptyState>
          )}
        </section>

        {products.length > 0 && (
          <section className="section" aria-labelledby="nuevos">
            <div className="section-head">
              <h2 id="nuevos" className="title">Recién publicado</h2>
              <Link href="/buscar" className="small" style={{ fontWeight: 700 }}>Ver más</Link>
            </div>
            <div className="product-grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        <section className="section">
          <div className="panel-dark card-pad" style={{ display: 'grid', gap: 20 }}>
            <div className="steps-band" style={{ width: 120 }} aria-hidden="true" />
            <h2 className="title">Tu negocio también florece.</h2>
            <p style={{ color: '#BDB5A9', maxWidth: '52ch', fontSize: 17, lineHeight: 1.6 }}>
              Abrí tu tienda de la 13 en línea: subí tus productos con foto y precio, y recibí los pedidos directo en tu WhatsApp. Sin
              mensualidad para empezar.
            </p>
            <div className="row">
              <Link href="/vende" className="btn btn-primary">Quiero vender</Link>
              <Link href="/entrar" className="btn btn-outline" style={{ color: 'var(--hueso)', borderColor: 'var(--hueso)' }}>
                Ya tengo tienda
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
