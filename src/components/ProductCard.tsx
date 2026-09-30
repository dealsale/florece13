import Link from 'next/link'
import { artSrc, CATEGORY_COLORS } from '@/lib/art'
import type { ProductCardData } from '@/lib/queries'
import { Price } from './Price'
import { QuickAdd } from './QuickAdd'

export function ProductCard({ product: p, showStore = true, i = 0 }: { product: ProductCardData; showStore?: boolean; i?: number }) {
  return (
    <div className="prod rise" style={{ ['--i' as string]: Math.min(i, 10) }}>
      <div className="prod__img">
        <Link href={`/p/${p.id}`} aria-label={p.name} style={{ display: 'block', height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl ?? artSrc('producto', p.id, p.categorySlug)} alt="" loading="lazy" decoding="async" />
        </Link>
        {!p.isAvailable && <span className="chip chip-dark">Agotado</span>}
        {p.isAvailable && <QuickAdd productId={p.id} storeId={p.storeId} name={p.name} />}
      </div>
      <Link href={`/p/${p.id}`} className="prod__txt">
        <span className="prod__name">{p.name}</span>
        {showStore && (
          <span className="prod__store">
            <span className="dot" style={{ ['--c' as string]: CATEGORY_COLORS[p.categorySlug ?? ''] }} />
            {p.storeName}
          </span>
        )}
        <Price value={p.price} compareAt={p.compareAtPrice} />
      </Link>
    </div>
  )
}
