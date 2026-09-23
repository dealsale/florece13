import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Florece 13',
    short_name: 'Florece 13',
    description: 'La Comuna 13, en línea. Del barrio, para todo el país.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F3EE',
    theme_color: '#F7F3EE',
    lang: 'es-CO',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
