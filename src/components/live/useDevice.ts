'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { deviceState } from '@/lib/actions/device'
import { deviceId } from '../location'

/* Estado del dispositivo (a quién sigue, si pidió ofertas cerca) compartido entre componentes. */

type State = { follows: string[]; nearDeals: boolean; push: boolean }
let state: State | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function setDeviceState(patch: Partial<State>) {
  state = { ...(state ?? { follows: [], nearDeals: false, push: false }), ...patch }
  emit()
}

export function useDevice() {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => null,
  )
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    const d = deviceId()
    setId(d) // eslint-disable-line react-hooks/set-state-in-effect
    if (d && !state && !loading) loading = deviceState(d).then((r) => setDeviceState(r))
  }, [])
  return { id, state: s }
}
