import { asJpeg, OG_SIZE, siteImage } from '@/lib/og'
import { appUrl } from '@/lib/url'

export const alt = 'Florece 13 · Del barrio, para todo el país. Artesanías, ropa, arte y sabores de la Comuna 13 de Medellín.'
export const size = OG_SIZE
export const contentType = 'image/jpeg'
// El dominio sale de APP_URL en tiempo de ejecución, no del build.
export const dynamic = 'force-dynamic'

export default async function Image() {
  return asJpeg(await siteImage({ domain: new URL(appUrl()).host }))
}
