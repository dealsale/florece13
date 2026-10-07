'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { followedFeed, myImpact } from '@/lib/actions/feed'
import { formatPrice } from '@/lib/format'
import { distanceLabel, distanceM, inComuna13 } from '@/lib/geo'
import type { MapStore } from '@/lib/queries'
import { openStatus } from '@/lib/time'
import { universe } from '@/lib/universes'
import { Avatar } from '../Avatar'
import { Icon } from '../Icon'
import { ProductCard } from '../ProductCard'
import { refreshIfGranted, useMyLocation } from '../location'
import { Countdown } from './Countdown'
import { myOrderIds } from './myOrders'
import { useDevice } from './useDevice'

/* ---------- 📍 Cerca de ti ---------- */

export function NearbyNow({ stores }: { stores: MapStore[] }) {
  const { loc, request } = useMyLocation()
  const [asking, setAsking] = useState(false)
  const [denied, setDenied] = useState(false)
  useEffect(() => {
    refreshIfGranted()
  }, [])

  const list = useMemo(() => {
    const withData = stores.map((s) => ({ s, d: loc ? distanceM(loc, s) : null, st: openStatus(s.hours) }))
    if (loc) return withData.sort((a, b) => a.d! - b.d!).slice(0, 8)
    // Sin ubicación: primero los abiertos y con oferta.
    return withData.sort((a, b) => Number(Boolean(b.s.deal)) - Number(Boolean(a.s.deal)) || Number(Boolean(b.st?.open)) - Number(Boolean(a.st?.open))).slice(0, 8)
  }, [stores, loc])

  if (stores.length === 0) return null
  const here = loc ? inComuna13(loc) : null

  return (
    <section className="sec">
      <div className="sec__head">
        <div>
          <span className="tag">{here ? 'estás en la 13' : 'a la vuelta'}</span>
          <h2 className="h2">{loc ? 'Cerca de ti' : 'Abierto en la 13'}</h2>
        </div>
        <Link href="/mapa" className="more"><Icon name="mapa" size={16} /> Mapa</Link>
      </div>
      {!loc && (
        <button
          type="button"
          className="locate"
          disabled={asking}
          onClick={async () => {
            setAsking(true)
            const r = await request()
            setDenied(!r)
            setAsking(false)
          }}
        >
          <span className="locate__ic"><Icon name="navegar" size={20} /></span>
          <span>
            <b>{asking ? 'Buscando…' : 'Estoy en la 13'}</b>
            <small>{denied ? 'No pudimos leer tu ubicación. Revisá el permiso del navegador.' : 'Compartí tu ubicación y te mostramos lo que tenés más cerca.'}</small>
          </span>
        </button>
      )}
      {loc && here === false && <p className="small muted" style={{ marginTop: -6 }}>Estás lejos de la 13: igual podés pedir a los que envían a todo el país.</p>}
      <div className="near">
        {list.map(({ s, d, st }, i) => {
          const u = universe(s.universe)
          return (
            <Link key={s.id} href={`/t/${s.slug}`} className="near__it rise" style={{ ['--i' as string]: i, ['--u' as string]: u?.color ?? 'var(--verde)' }}>
              <span className="near__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.coverUrl ? <img src={s.coverUrl} alt="" loading="lazy" /> : <span className="near__ic"><Icon name={s.icon} size={26} /></span>}
                {d !== null && <span className="near__d">{distanceLabel(d)}</span>}
              </span>
              <span className="near__b">
                <span className="near__n"><Avatar name={s.name} src={s.logoUrl} size={22} /> {s.name}</span>
                <span className="near__tags">
                  {st && <span className={st.open ? 'ok' : 'off'}><i className="dotlive" />{st.open ? 'Abierto' : 'Cerrado'}</span>}
                  {s.delivers && <span><Icon name="moto" size={13} /> Domicilio</span>}
                </span>
                {s.deal ? (
                  <span className="near__deal"><Icon name="rayo" size={13} /> {s.deal.title} · {formatPrice(s.deal.price)}</span>
                ) : s.cheapest ? (
                  <span className="near__p">{s.cheapest.name} · {formatPrice(s.cheapest.price)}</span>
                ) : (
                  <span className="near__p">{s.categoryName ?? s.sector}</span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- ♥ Tus tiendas ---------- */

type Feed = Awaited<ReturnType<typeof followedFeed>>

export function FollowedFeed() {
  const { state } = useDevice()
  const [feed, setFeed] = useState<Feed | null>(null)
  const key = state?.follows.join(',') ?? ''
  useEffect(() => {
    if (!key) return
    let alive = true
    followedFeed(key.split(',')).then((f) => alive && setFeed(f))
    return () => {
      alive = false
    }
  }, [key])
  if (!key || !feed || (feed.products.length === 0 && feed.deals.length === 0)) return null
  return (
    <section className="sec">
      <div className="sec__head"><div><span className="tag">lo que seguís</span><h2 className="h2">Tus tiendas</h2></div></div>
      {feed.deals.length > 0 && (
        <div className="today" style={{ marginBottom: 14 }}>
          {feed.deals.map((d) => (
            <Link key={d.id} href={`/ofertas#${d.id}`} className="today__it hot">
              <span className="today__ic"><Icon name="rayo" size={18} /></span>
              <span><b>{d.storeName}: {d.title}</b><small>{formatPrice(d.price)} · <Countdown endsAt={d.endsAt} /></small></span>
            </Link>
          ))}
        </div>
      )}
      {feed.products.length > 0 && <div className="rail rail-prods">{feed.products.map((p, i) => <ProductCard key={p.id} product={p} i={i} />)}</div>}
    </section>
  )
}

/* ---------- 🌱 Tu impacto ---------- */

type MyImpact = Awaited<ReturnType<typeof myImpact>>

export function MyImpact({ initialIds = [] }: { initialIds?: string[] }) {
  const [data, setData] = useState<MyImpact>(null)
  useEffect(() => {
    const ids = [...new Set([...initialIds, ...myOrderIds()])]
    if (ids.length === 0) return
    myImpact(ids).then(setData)
  }, [initialIds])
  if (!data || data.all.orders === 0) return null
  const m = data.month.orders > 0 ? data.month : data.all
  return (
    <div className="impact-me">
      <span className="tag">tu impacto {data.month.orders > 0 ? 'este mes' : ''}</span>
      <p>
        Compraste <b>{formatPrice(m.total)}</b> dentro de la Comuna 13.
      </p>
      <div className="impact-me__n">
        <span><Icon name="tienda" size={18} /> <b>{m.stores}</b> {m.stores === 1 ? 'negocio' : 'negocios'}</span>
        {m.entrepreneurs > 0 && <span><Icon name="florece" size={18} /> <b>{m.entrepreneurs}</b> {m.entrepreneurs === 1 ? 'emprendimiento nuevo' : 'emprendimientos nuevos'}</span>}
        {m.sectors > 0 && <span><Icon name="ubicacion" size={18} /> <b>{m.sectors}</b> {m.sectors === 1 ? 'sector' : 'sectores'}</span>}
      </div>
    </div>
  )
}
