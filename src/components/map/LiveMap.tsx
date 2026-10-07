'use client'

import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type * as Leaflet from 'leaflet'
import { formatPrice } from '@/lib/format'
import { COMUNA13, distanceLabel, distanceM } from '@/lib/geo'
import type { MapStore } from '@/lib/queries'
import { openStatus } from '@/lib/time'
import { universe } from '@/lib/universes'
import { Avatar } from '../Avatar'
import { Icon } from '../Icon'
import { Countdown } from '../live/Countdown'
import { useMyLocation } from '../location'
import { TILE_ATTRIBUTION, TILE_URL, loadLeaflet, pinHtml } from './leaflet'

export type MapEvent = { id: string; title: string; when: string; lat: number; lng: number; storeName: string; icon: string }

const FILTERS: { key: string; name: string; icon: string; match: (s: MapStore) => boolean }[] = [
  { key: 'todo', name: 'Todo', icon: 'mapa', match: () => true },
  { key: 'ofertas', name: 'Ofertas', icon: 'rayo', match: (s) => Boolean(s.deal) },
  { key: 'comprar', name: 'Tiendas', icon: 'carrito', match: (s) => s.universe === 'comprar' },
  { key: 'comer', name: 'Comida', icon: 'comida', match: (s) => s.universe === 'comer' },
  { key: 'barberias', name: 'Barberías', icon: 'tijeras', match: (s) => s.categorySlug === 'barberias' },
  { key: 'belleza', name: 'Belleza', icon: 'secador', match: (s) => ['belleza', 'unas', 'cosmeticos'].includes(s.categorySlug ?? '') },
  { key: 'arte', name: 'Arte', icon: 'arte', match: (s) => ['arte', 'grafiti'].includes(s.categorySlug ?? '') },
  { key: 'servicios', name: 'Servicios', icon: 'servicio', match: (s) => s.universe === 'servicios' },
  { key: 'cafe', name: 'Cafés', icon: 'cafe', match: (s) => s.categorySlug === 'cafe' },
  { key: 'eventos', name: 'Eventos', icon: 'evento', match: () => false },
  { key: 'hospedajes', name: 'Hospedajes', icon: 'cama', match: (s) => s.categorySlug === 'hospedajes' },
  { key: 'experiencias', name: 'Experiencias', icon: 'experiencia', match: (s) => s.universe === 'experiencias' },
]

const iconSvg = (name: string) => renderToStaticMarkup(<Icon name={name} size={18} stroke="#fff" strokeWidth={2.3} />)

export function LiveMap({ stores, events }: { stores: MapStore[]; events: MapEvent[] }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<Leaflet.Map | null>(null)
  const layer = useRef<Leaflet.LayerGroup | null>(null)
  const me = useRef<Leaflet.Marker | null>(null)
  const L = useRef<typeof Leaflet | null>(null)
  const [ready, setReady] = useState(false)
  const [filter, setFilter] = useState('todo')
  const [selected, setSelected] = useState<MapStore | null>(null)
  const { loc, request } = useMyLocation()

  const visible = useMemo(() => (filter === 'eventos' ? [] : stores.filter(FILTERS.find((f) => f.key === filter)!.match)), [stores, filter])
  const showEvents = filter === 'todo' || filter === 'eventos'

  useEffect(() => {
    let alive = true
    loadLeaflet().then((lib) => {
      if (!alive || !box.current || map.current) return
      L.current = lib
      const m = lib.map(box.current, { zoomControl: false }).setView([COMUNA13.lat, COMUNA13.lng], 16)
      lib.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(m)
      lib.control.zoom({ position: 'bottomright' }).addTo(m)
      m.on('click', () => setSelected(null))
      layer.current = lib.layerGroup().addTo(m)
      map.current = m
      setReady(true)
    })
    return () => {
      alive = false
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Pines de negocios y eventos según el filtro.
  useEffect(() => {
    const lib = L.current
    if (!ready || !lib || !layer.current) return
    layer.current.clearLayers()
    for (const s of visible) {
      const u = universe(s.universe)
      const icon = lib.divIcon({ className: '', html: pinHtml(s.deal ? '#E5379B' : u?.color ?? '#128C4B', iconSvg(s.deal ? 'rayo' : s.icon), { pulse: Boolean(s.deal) }), iconSize: [40, 48], iconAnchor: [20, 46] })
      lib.marker([s.lat, s.lng], { icon, title: s.name }).on('click', (e) => {
        lib.DomEvent.stopPropagation(e)
        setSelected(s)
      }).addTo(layer.current)
    }
    if (showEvents)
      for (const ev of events) {
        const icon = lib.divIcon({ className: '', html: pinHtml('#2ECC71', iconSvg(ev.icon), { label: ev.when }), iconSize: [40, 48], iconAnchor: [20, 46] })
        lib.marker([ev.lat, ev.lng], { icon, title: ev.title }).bindPopup(`<b>${ev.title.replace(/</g, '&lt;')}</b><br>${ev.when} · ${ev.storeName.replace(/</g, '&lt;')}<br><a href="/eventos#${ev.id}">Ver en la Agenda</a>`).addTo(layer.current)
      }
  }, [ready, visible, events, showEvents])

  // Mi ubicación.
  useEffect(() => {
    const lib = L.current
    if (!ready || !lib || !map.current || !loc) return
    const icon = lib.divIcon({ className: '', html: '<span class="me-dot"></span>', iconSize: [22, 22], iconAnchor: [11, 11] })
    if (me.current) me.current.setLatLng([loc.lat, loc.lng])
    else me.current = lib.marker([loc.lat, loc.lng], { icon, interactive: false, zIndexOffset: 1000 }).addTo(map.current)
  }, [ready, loc])

  const st = selected ? openStatus(selected.hours) : null
  return (
    <div className="lmap">
      <div ref={box} className="lmap__map" />
      <div className="lmap__filters">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`lchip${filter === f.key ? ' on' : ''}`} onClick={() => setFilter(f.key)}>
            <Icon name={f.icon} size={16} /> {f.name}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="lmap__me"
        aria-label="Centrar en mi ubicación"
        onClick={async () => {
          const p = loc ?? (await request())
          if (p) map.current?.setView([p.lat, p.lng], 17)
        }}
      >
        <Icon name="navegar" size={20} />
      </button>
      {selected && (
        <div className="lmap__card">
          <button type="button" className="lmap__x" aria-label="Cerrar" onClick={() => setSelected(null)}><Icon name="cerrar" size={16} /></button>
          <div className="row" style={{ flexWrap: 'nowrap', ['--gap' as string]: '12px' }}>
            <Avatar name={selected.name} src={selected.logoUrl} size={52} />
            <div style={{ minWidth: 0 }}>
              <b className="lmap__n">{selected.name}</b>
              <div className="near__tags">
                {loc && <span>{distanceLabel(distanceM(loc, selected))}</span>}
                {st && <span className={st.open ? 'ok' : 'off'}><i className="dotlive" />{st.label}</span>}
                {selected.delivers && <span><Icon name="moto" size={13} /> Domicilio</span>}
              </div>
            </div>
          </div>
          {selected.deal ? (
            <div className="near__deal" style={{ marginTop: 10 }}>
              <Icon name="rayo" size={14} /> {selected.deal.title} · {formatPrice(selected.deal.price)} · <Countdown endsAt={selected.deal.endsAt} />
            </div>
          ) : selected.cheapest ? (
            <p className="small muted" style={{ margin: '8px 0 0' }}>{selected.cheapest.name} · {formatPrice(selected.cheapest.price)}</p>
          ) : null}
          <div className="row" style={{ marginTop: 12, ['--gap' as string]: '8px' }}>
            <Link href={`/t/${selected.slug}`} className="btn btn-primary btn-sm">Ver negocio</Link>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-sm">
              <Icon name="navegar" size={16} /> Cómo llegar
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
