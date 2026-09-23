import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { StoreCard } from '@/components/StoreCard'
import { getCategories, listStores } from '@/lib/queries'

export const metadata: Metadata = { title: 'Tiendas de la 13' }

export default async function TiendasPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat = '' } = await searchParams
  const [categories, stores] = await Promise.all([getCategories(), listStores({ categorySlug: cat || undefined, limit: 120 })])

  return (
    <div className="container">
      <section className="section" style={{ paddingTop: 28 }}>
        <h1 className="title">Tiendas de la 13</h1>
        <p className="lede" style={{ marginTop: 8 }}>Cada tienda es de alguien del barrio. Conocé su historia y pedile directo.</p>
        <div className="cat-scroller" style={{ marginTop: 20 }}>
          <Link href="/tiendas" className="cat-pill" aria-current={!cat ? 'true' : undefined}>Todas</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/tiendas?cat=${c.slug}`} className="cat-pill" aria-current={cat === c.slug ? 'true' : undefined}>
              <Icon name={c.icon} size={20} /> {c.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 24 }}>
        {stores.length > 0 ? (
          <div className="store-grid">{stores.map((s) => <StoreCard key={s.id} store={s} />)}</div>
        ) : (
          <EmptyState icon="tienda" title="Aquí van a florecer las tiendas del barrio." text="Todavía no hay tiendas en esta categoría.">
            <Link href="/vende" className="btn btn-primary">Abrí la tuya</Link>
          </EmptyState>
        )}
      </section>
    </div>
  )
}
