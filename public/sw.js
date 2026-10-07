/* Florece 13 — service worker.
 * - Archivos del build (/_next/static), fuentes e íconos: se guardan y se sirven desde el celular.
 * - Fotos (/media): primero la copia guardada, se actualiza en segundo plano.
 * - Páginas: siempre de la red (precios, stock y sesión deben estar al día);
 *   sin conexión se muestra /offline.
 */
const VERSION = 'f13-v5'
const STATIC = `${VERSION}-static`
const MEDIA = `${VERSION}-media`
const OFFLINE = '/offline'
const PRECACHE = [OFFLINE, '/icons/icon-192.png', '/icons/apple-touch-icon.png', '/brand/lockup.webp', '/brand/lockup-light.webp']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function trimCache(name, max) {
  const cache = await caches.open(name)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then((r) => r || Response.error())))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || /\.(woff2?|ttf)$/.test(url.pathname) || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/brand/') || url.pathname.startsWith('/art/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(STATIC).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  if (url.pathname.startsWith('/media/')) {
    event.respondWith(
      caches.open(MEDIA).then((cache) =>
        cache.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone()).then(() => trimCache(MEDIA, 200))
              return res
            })
            .catch(() => hit || Response.error())
          return hit || net
        }),
      ),
    )
  }
})

/* ---------- notificaciones push ---------- */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Florece 13'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || 'florece13',
    renotify: true,
    data: { url: data.url || '/panel' },
    vibrate: [80, 40, 80],
  }
  const badge = 'setAppBadge' in self.navigator && data.badge ? self.navigator.setAppBadge(data.badge).catch(() => {}) : Promise.resolve()
  event.waitUntil(Promise.all([self.registration.showNotification(title, options), badge]))
})

/* Al tocar la notificación: si la app ya está abierta, la trae al frente y navega; si no, la abre. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/panel', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const same = list.find((c) => new URL(c.url).origin === self.location.origin)
      if (same) return same.focus().then((c) => (c && 'navigate' in c ? c.navigate(url) : undefined))
      return self.clients.openWindow(url)
    }),
  )
})
