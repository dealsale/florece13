'use client'

import type * as Leaflet from 'leaflet'

/** Carga Leaflet solo en el navegador (no funciona en el servidor) y una sola vez. */
let promise: Promise<typeof Leaflet> | null = null
export function loadLeaflet() {
  promise ??= import('leaflet').then((m) => (m as unknown as { default?: typeof Leaflet }).default ?? (m as typeof Leaflet))
  return promise
}

/** Mapa base de OpenStreetMap (libre; exige la atribución). */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/** Pin de la marca: gota con el ícono de la categoría (SVG en línea). */
export function pinHtml(color: string, iconSvg: string, opts: { pulse?: boolean; label?: string } = {}) {
  return `<span class="pin${opts.pulse ? ' pin--deal' : ''}" style="--c:${color}"><span class="pin__in">${iconSvg}</span>${opts.label ? `<span class="pin__lb">${opts.label}</span>` : ''}</span>`
}
