import Link from 'next/link'
import type { ProductCardData } from '@/lib/queries'
import { Icon } from './Icon'
import { Price } from './Price'

export function ProductCard({ product, showStore = true }: { product: ProductCardData; showStore?: boolean }) {
  return (
    <Link href={`/p/${product.id}`} className="product-card">
      <div className="product-card__img">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="no-photo"><Icon name="camara" size={32} /></div>
        )}
        {!product.isAvailable && <span className="chip">Agotado</span>}
      </div>
      <div className="product-card__body">
        <div className="product-card__name">{product.name}</div>
        {showStore && <div className="product-card__store">{product.storeName}</div>}
        <Price value={product.price} compareAt={product.compareAtPrice} />
      </div>
    </Link>
  )
}
