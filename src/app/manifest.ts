import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Florece 13',
    short_name: 'Florece 13',
    description: 'La Comuna 13, en línea. Artesanías, ropa, arte, recuerdos y sabores del barrio, directo de quienes los hacen.',
    start_url: '/?utm_source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F3EE',
    theme_color: '#F7F3EE',
    lang: 'es-CO',
    dir: 'ltr',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/app-icon/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app-icon/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcuts: [
      { name: 'Explorar productos', short_name: 'Explorar', url: '/buscar', icons: [{ src: '/app-icon/icon-192.png', sizes: '192x192' }] },
      { name: 'Tiendas de la 13', short_name: 'Tiendas', url: '/tiendas', icons: [{ src: '/app-icon/icon-192.png', sizes: '192x192' }] },
      { name: 'Mi carrito', short_name: 'Carrito', url: '/carrito', icons: [{ src: '/app-icon/icon-192.png', sizes: '192x192' }] },
      { name: 'Mi tienda (comerciantes)', short_name: 'Mi tienda', url: '/panel', icons: [{ src: '/app-icon/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
