import Link from 'next/link'
import type { StoreCardData } from '@/lib/queries'
import { Avatar } from './Avatar'

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link href={`/t/${store.slug}`} className="store-card">
      <div className={`store-card__cover ${store.coverUrl ? '' : 'pattern-steps'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {store.coverUrl && <img src={store.coverUrl} alt="" loading="lazy" />}
      </div>
      <div className="store-card__body">
        <div className="store-card__logo"><Avatar name={store.name} src={store.logoUrl} /></div>
        <div className="store-card__name">{store.name}</div>
        {store.tagline && <div className="store-card__tagline">{store.tagline}</div>}
        <div className="store-card__meta">
          {[store.categoryName, store.sector, `${store.productCount} ${store.productCount === 1 ? 'producto' : 'productos'}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
    </Link>
  )
}
