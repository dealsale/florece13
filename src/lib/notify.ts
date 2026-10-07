import 'server-only'
import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import webpush from 'web-push'
import { appSettings, db, devices, follows, notifications, orders, pushSubscriptions, stores, users } from '@/db'
import { distanceM } from './geo'
import { formatPrice } from './format'
import { SITE_URL } from './url'

/*
 * Notificaciones para las tiendas (y el admin):
 *  - quedan en la bandeja del panel (/panel/avisos)
 *  - y llegan como push al celular o computador donde se activaron, aunque la app esté cerrada.
 *
 * Las claves VAPID (las que identifican a Florece 13 ante Google/Apple/Mozilla) se crean solas la
 * primera vez y se guardan en la base. Se pueden fijar con VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.
 * Si cambian, las suscripciones existentes dejan de servir y hay que volver a activarlas.
 */

type Vapid = { publicKey: string; privateKey: string }
let vapidPromise: Promise<Vapid> | null = null

async function loadVapid(): Promise<Vapid> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }
  }
  const read = async () => (await db.select().from(appSettings).where(eq(appSettings.key, 'vapid')))[0]
  let row = await read()
  if (!row) {
    await db.insert(appSettings).values({ key: 'vapid', value: JSON.stringify(webpush.generateVAPIDKeys()) }).onConflictDoNothing()
    row = await read()
  }
  return JSON.parse(row!.value) as Vapid
}

export function getVapid() {
  vapidPromise ??= loadVapid().catch((e) => {
    vapidPromise = null
    throw e
  })
  return vapidPromise
}

export async function getVapidPublicKey() {
  return (await getVapid()).publicKey
}

type Notice = { kind: string; title: string; body: string; url: string; tag?: string }

/** Guarda el aviso en la bandeja de cada usuario y lo manda por push a sus dispositivos. */
export async function notify(userIds: string[], n: Notice) {
  const ids = [...new Set(userIds)]
  if (ids.length === 0) return
  await db.insert(notifications).values(ids.map((userId) => ({ userId, kind: n.kind, title: n.title, body: n.body, url: n.url })))

  const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, ids))
  if (subs.length === 0) return
  const unread = await db
    .select({ userId: notifications.userId, n: count() })
    .from(notifications)
    .where(and(inArray(notifications.userId, ids), isNull(notifications.readAt)))
    .groupBy(notifications.userId)
  const unreadBy = new Map(unread.map((u) => [u.userId, u.n]))

  const { publicKey, privateKey } = await getVapid()
  const subject = process.env.VAPID_SUBJECT || SITE_URL
  await Promise.all(
    subs.map(async (s) => {
      const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.tag ?? n.kind, badge: unreadBy.get(s.userId) ?? 1 })
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          vapidDetails: { subject, publicKey, privateKey },
          TTL: 60 * 60 * 24,
          urgency: 'high',
        })
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410: el navegador ya no tiene esa suscripción (desinstaló, borró datos, revocó el permiso).
        if (status === 404 || status === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id))
        else console.error('push', status ?? '', (err as Error).message)
      }
    }),
  )
}

/** Envía un push a un dispositivo. Devuelve 'gone' si el navegador ya no tiene esa suscripción. */
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: object): Promise<'ok' | 'gone' | 'error'> {
  const { publicKey, privateKey } = await getVapid()
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), {
      vapidDetails: { subject: process.env.VAPID_SUBJECT || SITE_URL, publicKey, privateKey },
      TTL: 60 * 60 * 6,
      urgency: 'normal',
    })
    return 'ok'
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return 'gone'
    console.error('push', status ?? '', (err as Error).message)
    return 'error'
  }
}

type DeviceRow = { id: string; endpoint: string | null; p256dh: string | null; auth: string | null }
async function pushDevices(rows: DeviceRow[], payload: object) {
  await Promise.all(
    rows.map(async (d) => {
      if (!d.endpoint || !d.p256dh || !d.auth) return
      if ((await sendPush({ endpoint: d.endpoint, p256dh: d.p256dh, auth: d.auth }, payload)) === 'gone')
        await db.update(devices).set({ endpoint: null, p256dh: null, auth: null, nearDeals: false }).where(eq(devices.id, d.id))
    }),
  )
}

/** Avisa a los celulares que siguen a la tienda (compradores sin cuenta). */
export async function notifyFollowers(storeId: string, n: { title: string; body: string; url: string; tag?: string }) {
  const rows = await db
    .select({ id: devices.id, endpoint: devices.endpoint, p256dh: devices.p256dh, auth: devices.auth })
    .from(follows)
    .innerJoin(devices, eq(devices.id, follows.deviceId))
    .where(eq(follows.storeId, storeId))
  await pushDevices(rows, { ...n, tag: n.tag ?? `store-${storeId}` })
}

/** "Avisarme de ofertas cerca": push a quien la activó y está dentro de su radio (y no sigue ya a la tienda). */
export async function notifyNearDeal(storeId: string, dealId: string) {
  const [store] = await db.select({ name: stores.name, lat: stores.lat, lng: stores.lng }).from(stores).where(eq(stores.id, storeId))
  if (!store || store.lat == null || store.lng == null) return
  const [deal] = await db.query.deals.findMany({ where: (d, { eq: e }) => e(d.id, dealId), limit: 1 })
  if (!deal) return
  const followers = new Set((await db.select({ id: follows.deviceId }).from(follows).where(eq(follows.storeId, storeId))).map((f) => f.id))
  const near = (await db.select().from(devices).where(eq(devices.nearDeals, true))).filter(
    (d) => !followers.has(d.id) && d.lat != null && d.lng != null && distanceM({ lat: d.lat, lng: d.lng }, { lat: store.lat!, lng: store.lng! }) <= d.radiusM,
  )
  const off = deal.originalPrice ? ` (antes ${formatPrice(deal.originalPrice)})` : ''
  for (const d of near) {
    const m = Math.round(distanceM({ lat: d.lat!, lng: d.lng! }, { lat: store.lat, lng: store.lng }) / 10) * 10
    await pushDevices([d], { title: `⚡ Cerca de ti: ${deal.title}`, body: `${store.name} · ${formatPrice(deal.price)}${off} · a ${m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`}`, url: `/ofertas#${deal.id}`, tag: `deal-${deal.id}` })
  }
}

/** Nunca dejar que un aviso tumbe la acción principal (crear un pedido, aprobar una tienda…). */
export async function safeNotify(fn: () => Promise<void>) {
  try {
    await fn()
  } catch (err) {
    console.error('notify', err)
  }
}

/* ---------- eventos ---------- */

export async function notifyNewOrder(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { store: { columns: { ownerId: true } }, items: { columns: { quantity: true } } },
  })
  if (!order) return
  const units = order.items.reduce((n, i) => n + i.quantity, 0)
  const first = order.customerName.split(' ')[0]
  await notify([order.store.ownerId], {
    kind: 'pedido',
    title: `🛍️ Nuevo pedido ${order.code}`,
    body: `${first} pidió ${units} ${units === 1 ? 'producto' : 'productos'} por ${formatPrice(order.total)}. ${order.deliveryMethod === 'ENVIO' ? `Envío a ${order.city}.` : 'Recoge en la tienda.'}`,
    url: `/panel/pedidos/${order.id}`,
    tag: `pedido-${order.id}`,
  })
}

export async function notifyStoreStatus(storeId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') {
  const [store] = await db.select({ ownerId: stores.ownerId, name: stores.name, slug: stores.slug }).from(stores).where(eq(stores.id, storeId))
  if (!store) return
  if (status === 'ACTIVE') {
    await notify([store.ownerId], {
      kind: 'tienda',
      title: '🌸 ¡Tu tienda ya está publicada!',
      body: `${store.name} ya aparece en Florece 13. Compartí tu link y tu QR para que te encuentren.`,
      url: '/panel',
    })
  } else if (status === 'SUSPENDED') {
    await notify([store.ownerId], {
      kind: 'tienda',
      title: 'Tu tienda quedó en pausa',
      body: `${store.name} no aparece al público por ahora. Escribinos para revisarlo.`,
      url: '/panel',
    })
  }
}

export async function notifyNewStore(storeId: string) {
  const [store] = await db.select({ name: stores.name }).from(stores).where(eq(stores.id, storeId))
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'ADMIN'))
  if (!store || admins.length === 0) return
  await notify(
    admins.map((a) => a.id),
    { kind: 'admin', title: '🏪 Nueva tienda para revisar', body: `${store.name} pidió unirse a Florece 13.`, url: '/admin' },
  )
}

/** Avisos sin leer (para el contador del panel). */
export async function unreadCount(userId: string) {
  const [{ n }] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return n
}

