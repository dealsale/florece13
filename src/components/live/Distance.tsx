'use client'

import { distanceLabel, distanceM } from '@/lib/geo'
import { Icon } from '../Icon'
import { useMyLocation } from '../location'

/** "A 350 m" si el visitante compartió su ubicación; si no, el sector. */
export function Distance({ lat, lng, fallback }: { lat: number | null; lng: number | null; fallback?: string }) {
  const { loc } = useMyLocation()
  if (loc && lat != null && lng != null)
    return (
      <span className="dist">
        <Icon name="ubicacion" size={13} /> {distanceLabel(distanceM(loc, { lat, lng }))}
      </span>
    )
  return fallback ? (
    <span className="dist">
      <Icon name="ubicacion" size={13} /> {fallback}
    </span>
  ) : null
}
