import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { StoreCard } from '@/components/StoreCard'
import { getCategories, listProducts, listStores } from '@/lib/queries'

export const metadata: Metadata = { title: 'Explorar productos' }

const PAGE_SIZE = 24

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; pagina?: string }> }) {
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
    <div className="wrap">
      <section className="stack" style={{ paddingTop: 24 }}>
        <form action="/buscar" className="search" role="search" style={{ maxWidth: 'none', boxShadow: 'var(--sh-1)' }}>
          <Icon name="buscar" size={20} />
          {cat && <input type="hidden" name="cat" value={cat} />}
          <label htmlFor="q" className="vh">Buscar</label>
          <input id="q" name="q" defaultValue={q} placeholder="¿Qué estás buscando?" autoComplete="off" style={{ marginLeft: 10 }} />
          <button className="btn btn-primary" type="submit">Buscar</button>
        </form>
        <div className="pills">
          <Link href={href({ cat: '', pagina: '' })} className="pill" aria-current={!cat ? 'true' : undefined}>Todo</Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ cat: c.slug, pagina: '' })} className="pill" aria-current={cat === c.slug ? 'true' : undefined}>
              <Icon name={c.icon} size={18} /> {c.name}
            </Link>
          ))}
        </div>
      </section>

      {stores.length > 0 && (
        <section className="sec" style={{ paddingTop: 28 }}>
          <h2 className="h3" style={{ marginBottom: 14 }}>Tiendas</h2>
          <div className="rail">{stores.map((s, i) => <StoreCard key={s.id} store={s} i={i} />)}</div>
        </section>
      )}

      <section className="sec" style={{ paddingTop: 24 }}>
        <div className="sec__head">
          <h1 className="h2">{q ? `“${q}”` : category ? category.name : 'Todo lo de la 13'}</h1>
          <span className="muted small">{shown.length}{hasMore ? '+' : ''} {shown.length === 1 ? 'producto' : 'productos'}</span>
        </div>
        {shown.length > 0 ? (
          <>
            <div className="grid-prods">{shown.map((p, i) => <ProductCard key={p.id} product={p} i={i % PAGE_SIZE} />)}</div>
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
                <Link href={href({ pagina: String(page + 1) })} className="btn btn-light" scroll={false}>Ver más productos</Link>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            motif="escalera"
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
