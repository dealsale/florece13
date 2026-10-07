/* Ubicación: distancias y la zona de la Comuna 13 (San Javier, Medellín). */

export const COMUNA13 = { lat: 6.2538, lng: -75.6131 }
/** Radio aproximado para decir "estás en la 13". */
export const COMUNA13_RADIUS_M = 2200

export type LatLng = { lat: number; lng: number }

export function distanceM(a: LatLng, b: LatLng) {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** "A 120 m", "A 1,4 km" */
export function distanceLabel(m: number) {
  if (m < 1000) return `A ${Math.max(10, Math.round(m / 10) * 10)} m`
  return `A ${(m / 1000).toFixed(1).replace('.', ',')} km`
}

export const inComuna13 = (p: LatLng) => distanceM(p, COMUNA13) <= COMUNA13_RADIUS_M
export const validLatLng = (lat: unknown, lng: unknown) =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
