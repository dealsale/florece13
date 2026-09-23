import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { getCategories, listProducts, listStores } from '@/lib/queries'

export const metadata: Metadata = { title: 'Explorar productos' }

const PAGE_SIZE = 24

type Search = Promise<{ q?: string; cat?: string; pagina?: string }>

export default async function BuscarPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const cat = sp.cat ?? ''
  const page = Math.max(1, Number.parseInt(sp.pagina ?? '1', 10) || 1)

  const [categories, products, stores] = await Promise.all([
    getCategories(),
    listProducts({ q, categorySlug: cat || undefined, limit: PAGE_SIZE * page + 1 }),
    q ? listStores({ q, limit: 6 }) : Promise.resolve([]),
  ])
  const hasMore = products.length > PAGE_SIZE * page
  const shown = products.slice(0, PAGE_SIZE * page)
  const category = categories.find((c) => c.slug === cat)

  const href = (params: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q && { q }), ...(cat && { cat }), ...params })
    for (const [k, v] of [...u.entries()]) if (!v) u.delete(k)
    const s = u.toString()
    return s ? `/buscar?${s}` : '/buscar'
  }

  return (
    <div className="container">
      <section className="section" style={{ paddingTop: 24 }}>
        <form action="/buscar" className="hero__search" role="search" style={{ marginTop: 0, maxWidth: 'none' }}>
          <label htmlFor="q" className="visually-hidden">Buscar</label>
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input id="q" name="q" defaultValue={q} className="input" placeholder="¿Qué estás buscando?" autoComplete="off" />
          <button className="btn btn-dark" type="submit" aria-label="Buscar"><Icon name="buscar" /></button>
        </form>
        <div className="cat-scroller" style={{ marginTop: 14 }}>
          <Link href={href({ cat: '', pagina: '' })} className="cat-pill" aria-current={!cat ? 'true' : undefined}>Todo</Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ cat: c.slug, pagina: '' })} className="cat-pill" aria-current={cat === c.slug ? 'true' : undefined}>
              <Icon name={c.icon} size={20} /> {c.name}
            </Link>
          ))}
        </div>
      </section>

      {stores.length > 0 && (
        <section className="section" style={{ paddingTop: 28 }}>
          <h2 className="title-sm" style={{ marginBottom: 14 }}>Tiendas</h2>
          <div className="store-grid">{stores.map((s) => <StoreCard key={s.id} store={s} />)}</div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 28 }}>
        <h1 className="title-sm" style={{ marginBottom: 14 }}>
          {q ? <>Resultados para “{q}”</> : category ? category.name : 'Todos los productos'}
        </h1>
        {shown.length > 0 ? (
          <>
            <div className="product-grid">{shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
                <Link href={href({ pagina: String(page + 1) })} className="btn btn-outline" scroll={false}>Ver más productos</Link>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="buscar"
            title={q ? 'No encontramos eso todavía.' : 'Aquí van a florecer los productos de la 13.'}
            text={q ? 'Probá con otra palabra o mirá todas las categorías.' : 'Las tiendas del barrio están subiendo sus productos. Volvé pronto.'}
          >
            {(q || cat) && <Link href="/buscar" className="btn btn-outline">Ver todo</Link>}
          </EmptyState>
        )}
      </section>
    </div>
  )
}
