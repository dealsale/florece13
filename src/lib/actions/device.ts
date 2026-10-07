'use server'

import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db, devices, follows, stores } from '@/db'
import { getVapidPublicKey } from '@/lib/notify'

/*
 * Compradores sin cuenta: cada celular tiene un id anónimo (lo genera el navegador).
 * Con eso sigue negocios y recibe avisos (de lo que siguen y de ofertas Flash cerca).
 */

const id = z.uuid()
const subSchema = z.object({ endpoint: z.url().max(1000), keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }) })

async function ensure(deviceId: string) {
  await db.insert(devices).values({ id: deviceId }).onConflictDoUpdate({ target: devices.id, set: { lastSeenAt: new Date() } })
}

export async function publicPushKey() {
  return getVapidPublicKey()
}

export async function saveDevicePush(deviceId: string, raw: unknown) {
  if (!id.safeParse(deviceId).success) return { ok: false }
  const sub = subSchema.safeParse(raw)
  if (!sub.success) return { ok: false }
  await ensure(deviceId)
  // La misma suscripción no puede quedar en dos dispositivos.
  await db.update(devices).set({ endpoint: null, p256dh: null, auth: null }).where(and(eq(devices.endpoint, sub.data.endpoint), ne(devices.id, deviceId)))
  await db.update(devices).set({ endpoint: sub.data.endpoint, p256dh: sub.data.keys.p256dh, auth: sub.data.keys.auth }).where(eq(devices.id, deviceId))
  return { ok: true }
}

export async function setNearDeals(deviceId: string, on: boolean, lat?: number, lng?: number, radiusM = 1500) {
  if (!id.safeParse(deviceId).success) return { ok: false }
  await ensure(deviceId)
  const pos = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).safeParse({ lat, lng })
  if (on && !pos.success) return { ok: false }
  await db
    .update(devices)
    .set(on && pos.success ? { nearDeals: true, lat: pos.data.lat, lng: pos.data.lng, radiusM: Math.min(5000, Math.max(300, Math.round(radiusM))) } : { nearDeals: false })
    .where(eq(devices.id, deviceId))
  return { ok: true }
}

export async function deviceState(deviceId: string) {
  if (!id.safeParse(deviceId).success) return { follows: [] as string[], nearDeals: false, push: false }
  const [d] = await db.select().from(devices).where(eq(devices.id, deviceId))
  const f = d ? await db.select({ storeId: follows.storeId }).from(follows).where(eq(follows.deviceId, deviceId)) : []
  return { follows: f.map((x) => x.storeId), nearDeals: Boolean(d?.nearDeals), push: Boolean(d?.endpoint) }
}

export async function toggleFollow(deviceId: string, storeId: string, on: boolean) {
  if (!id.safeParse(deviceId).success || !id.safeParse(storeId).success) return { ok: false }
  const [store] = await db.select({ id: stores.id }).from(stores).where(and(eq(stores.id, storeId), eq(stores.status, 'ACTIVE')))
  if (!store) return { ok: false }
  await ensure(deviceId)
  if (on) await db.insert(follows).values({ deviceId, storeId }).onConflictDoNothing()
  else await db.delete(follows).where(and(eq(follows.deviceId, deviceId), eq(follows.storeId, storeId)))
  return { ok: true }
}
