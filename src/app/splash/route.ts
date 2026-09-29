import { ladera } from '@/lib/art'
import { splashImage } from '@/lib/og'
import { SPLASH_SIZES } from '@/lib/pwa'

/** /splash?w=1179&h=2556 — solo tamaños de pantalla conocidos (en píxeles reales). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const w = Number(searchParams.get('w'))
  const h = Number(searchParams.get('h'))
  if (!SPLASH_SIZES.some((s) => s.w * s.r === w && s.h * s.r === h)) return new Response('No encontrado', { status: 404 })
  const res = await splashImage(w, h, ladera('florece-hero', { w: 1200, h: 504 }))
  res.headers.set('Cache-Control', 'public, max-age=604800, immutable')
  return res
}
