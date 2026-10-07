'use client'

import { publicPushKey, saveDevicePush } from '@/lib/actions/device'

/* Push para compradores sin cuenta (avisos de tiendas seguidas y ofertas cerca). */

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

/** Pide permiso (debe llamarse desde un toque) y guarda la suscripción en este dispositivo. */
export async function enableDevicePush(deviceId: string): Promise<'ok' | 'denied' | 'unsupported' | 'error'> {
  if (!pushSupported()) return 'unsupported'
  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return 'denied'
    const reg = (await navigator.serviceWorker.getRegistration('/')) ?? (await navigator.serviceWorker.register('/sw.js', { scope: '/' }))
    await navigator.serviceWorker.ready
    const key = await publicPushKey()
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) }))
    const res = await saveDevicePush(deviceId, sub.toJSON())
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}
