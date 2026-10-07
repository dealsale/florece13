'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import { COMUNA13 } from '@/lib/geo'
import { Icon } from '../Icon'
import { TILE_ATTRIBUTION, TILE_URL, loadLeaflet, pinHtml } from './leaflet'

/** Marcar la ubicación del negocio en el mapa: arrastrando el pin o con "Usar mi ubicación". */
export function LocationPicker({ initial }: { initial: { lat: number | null; lng: number | null } }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<Leaflet.Map | null>(null)
  const marker = useRef<Leaflet.Marker | null>(null)
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null)
  const [locating, setLocating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let alive = true
    loadLeaflet().then((L) => {
      if (!alive || !box.current || map.current) return
      const start = pos ?? COMUNA13
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], pos ? 17 : 15)
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(m)
      const icon = L.divIcon({ className: '', html: pinHtml('#E5379B', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M4 11 12 4l8 7v8H4z"/></svg>'), iconSize: [40, 48], iconAnchor: [20, 46] })
      const mk = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(m)
      mk.on('dragend', () => {
        const p = mk.getLatLng()
        setPos({ lat: p.lat, lng: p.lng })
      })
      m.on('click', (e: Leaflet.LeafletMouseEvent) => {
        mk.setLatLng(e.latlng)
        setPos({ lat: e.latlng.lat, lng: e.latlng.lng })
      })
      map.current = m
      marker.current = mk
    })
    return () => {
      alive = false
      map.current?.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const useMine = () => {
    if (!('geolocation' in navigator)) return setMsg('Este navegador no permite usar la ubicación.')
    setLocating(true)
    setMsg('')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(next)
        marker.current?.setLatLng([next.lat, next.lng])
        map.current?.setView([next.lat, next.lng], 18)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setMsg('No pudimos leer tu ubicación. Mové el pin a mano.')
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  return (
    <div className="field">
      <span className="flabel">Ubicación en el mapa</span>
      <input type="hidden" name="lat" value={pos ? pos.lat.toFixed(6) : ''} />
      <input type="hidden" name="lng" value={pos ? pos.lng.toFixed(6) : ''} />
      <div ref={box} className="pick-map" />
      <div className="row" style={{ ['--gap' as string]: '8px' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={useMine} disabled={locating}>
          <Icon name="navegar" size={16} /> {locating ? 'Buscando…' : 'Usar mi ubicación'}
        </button>
        {pos && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setPos(null)
              setMsg('Tu negocio no va a aparecer en el mapa ni en "Cerca de ti".')
            }}
          >
            Quitar del mapa
          </button>
        )}
      </div>
      <span className="hint">{msg || (pos ? 'Arrastrá el pin o tocá el mapa para ajustarlo.' : 'Tocá el mapa donde está tu negocio. Así te encuentran en "Cerca de ti".')}</span>
    </div>
  )
}
