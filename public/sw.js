/* Florece 13 — service worker.
 * - Archivos del build (/_next/static), fuentes e íconos: se guardan y se sirven desde el celular.
 * - Fotos (/media): primero la copia guardada, se actualiza en segundo plano.
 * - Páginas: siempre de la red (precios, stock y sesión deben estar al día);
 *   sin conexión se muestra /offline.
 */
const VERSION = 'f13-v1'
const STATIC = `${VERSION}-static`
const MEDIA = `${VERSION}-media`
const OFFLINE = '/offline'
const PRECACHE = [OFFLINE, '/icon', '/apple-icon', '/app-icon/icon-192.png']

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

  if (url.pathname.startsWith('/_next/static/') || /\.(woff2?|ttf)$/.test(url.pathname) || url.pathname.startsWith('/app-icon/')) {
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
