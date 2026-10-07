'use client'

import { useCallback, useSyncExternalStore } from 'react'

/*
 * Ubicación del visitante (solo si la comparte) y el id de este dispositivo.
 * Se guarda en el celular para no volver a pedirla en cada página; vale por 2 horas.
 */

const LOC_KEY = 'f13_ubicacion'
const DEVICE_KEY = 'f13_dispositivo'
const MAX_AGE = 2 * 3600_000
type Loc = { lat: number; lng: number; at: number }

let cached: Loc | null | undefined
function read(): Loc | null {
  if (cached !== undefined) return cached
  try {
    const v = JSON.parse(localStorage.getItem(LOC_KEY) ?? 'null') as Loc | null
    cached = v && Date.now() - v.at < MAX_AGE ? v : null
  } catch {
    cached = null
  }
  return cached
}
const listeners = new Set<() => void>()
function save(loc: Loc | null) {
  cached = loc
  try {
    if (loc) localStorage.setItem(LOC_KEY, JSON.stringify(loc))
    else localStorage.removeItem(LOC_KEY)
  } catch {}
  listeners.forEach((l) => l())
}

export function useMyLocation() {
  const loc = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => null,
  )
  /** Pide la ubicación (hay que llamarlo desde un toque). */
  const request = useCallback(
    () =>
      new Promise<Loc | null>((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const next = { lat: p.coords.latitude, lng: p.coords.longitude, at: Date.now() }
            save(next)
            resolve(next)
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 },
        )
      }),
    [],
  )
  return { loc, request, clear: () => save(null) }
}

/** Si el permiso ya estaba concedido, refresca la ubicación sin preguntar. */
export async function refreshIfGranted() {
  try {
    const st = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
    if (st?.state !== 'granted') return
    navigator.geolocation.getCurrentPosition((p) => save({ lat: p.coords.latitude, lng: p.coords.longitude, at: Date.now() }), () => {}, { maximumAge: 300000, timeout: 10000 })
  } catch {}
}

/** Id anónimo de este dispositivo (para seguir negocios y recibir avisos sin cuenta). */
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}
