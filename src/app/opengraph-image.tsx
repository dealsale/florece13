import { ladera } from '@/lib/art'
import { OG_SIZE, siteImage } from '@/lib/og'
import { appUrl } from '@/lib/url'

export const alt = 'Florece 13 · Del barrio, para todo el país. Artesanías, ropa, arte y sabores de la Comuna 13 de Medellín.'
export const size = OG_SIZE
export const contentType = 'image/png'
// El dominio sale de APP_URL en tiempo de ejecución, no del build.
export const dynamic = 'force-dynamic'

export default function Image() {
  return siteImage({
    ladera: ladera('florece-hero', { w: 1400, h: 300, flowerAt: [1180, 40, 1.6] }),
    domain: new URL(appUrl()).host,
  })
}
