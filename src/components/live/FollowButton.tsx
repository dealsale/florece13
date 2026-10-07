'use client'

import { useState } from 'react'
import { toggleFollow } from '@/lib/actions/device'
import { Icon } from '../Icon'
import { useCart } from '../cart'
import { enableDevicePush, pushSupported } from './devicePush'
import { setDeviceState, useDevice } from './useDevice'

/** ♡ Seguir: sin cuenta. La primera vez ofrece activar los avisos de lo que publique. */
export function FollowButton({ storeId, storeName, compact = false }: { storeId: string; storeName: string; compact?: boolean }) {
  const { id, state } = useDevice()
  const { toast } = useCart()
  const [busy, setBusy] = useState(false)
  const following = Boolean(state?.follows.includes(storeId))

  const onClick = async () => {
    if (!id || !state) return
    setBusy(true)
    const next = !following
    setDeviceState({ follows: next ? [...state.follows, storeId] : state.follows.filter((s) => s !== storeId) })
    const res = await toggleFollow(id, storeId, next)
    if (!res.ok) setDeviceState({ follows: state.follows })
    else if (next) {
      toast(`Seguís a ${storeName}`)
      // Avisos: se piden dentro del mismo toque (iPhone lo exige) y solo si todavía no están.
      if (!state.push && pushSupported() && Notification.permission !== 'denied') {
        const r = await enableDevicePush(id)
        if (r === 'ok') setDeviceState({ push: true })
      }
    }
    setBusy(false)
  }

  return (
    <button type="button" className={`btn ${following ? 'btn-light' : 'btn-outline'} ${compact ? 'btn-sm' : ''} follow${following ? ' on' : ''}`} onClick={onClick} disabled={busy || !state} aria-pressed={following}>
      <Icon name={following ? 'corazonLleno' : 'corazon'} size={18} /> {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
