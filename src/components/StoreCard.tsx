import Link from 'next/link'
import { storeCover } from '@/lib/art'
import type { StoreCardData } from '@/lib/queries'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { Svg } from './Svg'

export function StoreCard({ store: s, i = 0 }: { store: StoreCardData; i?: number }) {
  return (
    <Link href={`/t/${s.slug}`} className="store rise" style={{ ['--i' as string]: i }}>
      <div className="store__cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {s.coverUrl ? <img src={s.coverUrl} alt="" loading="lazy" /> : <Svg html={storeCover(s.id, s.categorySlug)} />}
      </div>
      <div className="store__body">
        <div className="store__av"><Avatar name={s.name} src={s.logoUrl} categorySlug={s.categorySlug} /></div>
        <div className="store__name">{s.name}</div>
        {s.tagline && <div className="store__tl">{s.tagline}</div>}
        <div className="store__meta">
          {s.sector && <span className="chip"><Icon name="ubicacion" size={13} /> {s.sector}</span>}
          <span className="chip">{s.productCount} {s.productCount === 1 ? 'producto' : 'productos'}</span>
        </div>
      </div>
    </Link>
  )
}
