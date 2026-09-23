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
    <div className="wrap">
      <section className="stack" style={{ paddingTop: 28 }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>gente de a pie con orgullo</span>
        <h1 className="h1">Tiendas de la 13</h1>
        <p className="lede">Cada tienda es de alguien del barrio. Conocé su historia y pedile directo.</p>
        <div className="pills">
          <Link href="/tiendas" className="pill" aria-current={!cat ? 'true' : undefined}>Todas</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/tiendas?cat=${c.slug}`} className="pill" aria-current={cat === c.slug ? 'true' : undefined}>
              <Icon name={c.icon} size={18} /> {c.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 24 }}>
        {stores.length > 0 ? (
          <div className="grid-stores">{stores.map((s, i) => <StoreCard key={s.id} store={s} i={i} />)}</div>
        ) : (
          <EmptyState title="Aquí van a florecer las tiendas del barrio." text="Todavía no hay tiendas en esta categoría.">
            <Link href="/vende" className="btn btn-primary">Abrí la tuya</Link>
          </EmptyState>
        )}
      </section>
    </div>
  )
}
