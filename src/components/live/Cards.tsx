import Link from 'next/link'
import { eventKind } from '@/lib/agenda'
import { formatPrice } from '@/lib/format'
import type { DealItem, EventItem, JobItem } from '@/lib/live-queries'
import { hourLabel, whenLabel } from '@/lib/time'
import { waLink } from '@/lib/whatsapp'
import { Avatar } from '../Avatar'
import { Icon } from '../Icon'
import { Countdown } from './Countdown'
import { Distance } from './Distance'

const pct = (price: number, original: number | null) => (original && original > price ? Math.round((1 - price / original) * 100) : 0)

/** ⚡ FLORECE FLASH · precio, descuento, cuenta regresiva y distancia. */
export function DealCard({ d, compact = false }: { d: DealItem; compact?: boolean }) {
  const off = pct(d.price, d.originalPrice)
  return (
    <article id={d.id} className={`deal${compact ? ' compact' : ''}`}>
      <Link href={`/t/${d.storeSlug}`} className="deal__img">
        {d.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="deal__ph"><Icon name="rayo" size={34} /></span>
        )}
        <span className="deal__badge"><Icon name="rayo" size={13} /> Florece Flash</span>
        {off > 0 && <span className="deal__off">−{off}%</span>}
      </Link>
      <div className="deal__b">
        <h3 className="deal__t">{d.title}</h3>
        <div className="deal__p">
          <b>{formatPrice(d.price)}</b>
          {d.originalPrice && d.originalPrice > d.price && <s>{formatPrice(d.originalPrice)}</s>}
        </div>
        <div className="deal__m">
          <Countdown endsAt={d.endsAt.toISOString()} />
          <Distance lat={d.lat} lng={d.lng} fallback={d.storeSector || undefined} />
        </div>
        {!compact && d.description && <p className="small muted">{d.description}</p>}
        <Link href={`/t/${d.storeSlug}`} className="deal__s">
          <Avatar name={d.storeName} src={d.storeLogo} size={24} /> {d.storeName}
        </Link>
      </div>
    </article>
  )
}

export function EventCard({ e }: { e: EventItem }) {
  const k = eventKind(e.category)
  return (
    <article id={e.id} className="evc">
      <div className="evc__date">
        <Icon name={k.icon} size={20} />
        <span>{k.name}</span>
      </div>
      <div className="evc__b">
        <span className="evc__when"><Icon name="reloj" size={14} /> {whenLabel(e.startsAt)}{e.endsAt ? ` – ${hourLabel(e.endsAt)}` : ''}</span>
        <h3 className="evc__t">{e.title}</h3>
        {e.description && <p className="small muted evc__d">{e.description}</p>}
        <div className="evc__m">
          <span className={`chip ${e.price ? '' : 'chip-florece'}`}>{e.price ? formatPrice(e.price) : 'Entrada libre'}</span>
          {e.place ? (
            <span className="dist"><Icon name="ubicacion" size={13} /> {e.place}</span>
          ) : (
            <Distance lat={e.lat} lng={e.lng} fallback={e.storeSector || undefined} />
          )}
        </div>
        <Link href={`/t/${e.storeSlug}`} className="deal__s">
          <Avatar name={e.storeName} src={e.storeLogo} size={24} /> {e.storeName}
        </Link>
      </div>
      {e.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="evc__img" src={e.imageUrl} alt="" loading="lazy" />
      )}
    </article>
  )
}

export function JobCard({ j }: { j: JobItem }) {
  const msg = `¡Hola, ${j.storeName}! Vi en Florece 13 que buscan "${j.title}" y me interesa. ¿Me cuentan más?`
  return (
    <article className="job">
      <div className="job__h">
        <Avatar name={j.storeName} src={j.storeLogo} size={44} />
        <div style={{ minWidth: 0 }}>
          <h3 className="job__t">{j.title}</h3>
          <Link href={`/t/${j.storeSlug}`} className="small muted">{j.storeName}</Link>
        </div>
      </div>
      <div className="job__m">
        {j.storeSector && <span className="chip"><Icon name="ubicacion" size={13} /> {j.storeSector}</span>}
        {j.schedule && <span className="chip"><Icon name="reloj" size={13} /> {j.schedule}</span>}
        {j.pay && <span className="chip chip-florece">{j.pay}</span>}
      </div>
      {j.description && <p className="small" style={{ margin: 0 }}>{j.description}</p>}
      <a className="btn btn-wa btn-sm" href={waLink(j.storeWhatsapp, msg)} target="_blank" rel="noopener noreferrer">
        <Icon name="whatsapp" size={16} /> Postularme por WhatsApp
      </a>
    </article>
  )
}
