'use client'

import { useEffect } from 'react'
import { markAllNotificationsRead } from '@/lib/actions/notifications'

/** Al abrir Avisos, se marcan como leídos (el punto verde se ve en esta visita) y se limpia el globito del ícono. */
export function MarkRead() {
  useEffect(() => {
    const t = setTimeout(() => {
      markAllNotificationsRead().catch(() => {})
      if ('clearAppBadge' in navigator) (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [])
  return null
}
