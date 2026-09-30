'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db, notifications, pushSubscriptions } from '@/db'
import { requireUser } from '@/lib/auth'
import { getVapidPublicKey, notify } from '@/lib/notify'

const subSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
})

export async function pushPublicKey() {
  await requireUser()
  return getVapidPublicKey()
}

/** Guarda (o reasigna a este usuario) la suscripción push de este dispositivo. */
export async function savePushSubscription(raw: unknown) {
  const user = await requireUser()
  const parsed = subSchema.safeParse(raw)
  if (!parsed.success) return { ok: false }
  const { endpoint, keys } = parsed.data
  const userAgent = ((await headers()).get('user-agent') ?? '').slice(0, 300)
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent } })
  return { ok: true }
}

export async function removePushSubscription(endpoint: string) {
  const user = await requireUser()
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)))
  return { ok: true }
}

/** Notificación de prueba para confirmar que llega a este dispositivo. */
export async function sendTestNotification() {
  const user = await requireUser()
  await notify([user.id], {
    kind: 'prueba',
    title: '🌸 ¡Las notificaciones funcionan!',
    body: 'Así te vamos a avisar cuando te llegue un pedido.',
    url: '/panel/avisos',
  })
  revalidatePath('/panel', 'layout')
  return { ok: true }
}

export async function markAllNotificationsRead() {
  const user = await requireUser()
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
  revalidatePath('/panel', 'layout')
}
