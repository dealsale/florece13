import { productArt, storeCover } from '@/lib/art'

/**
 * Ilustraciones de marca como imágenes cacheables (/art/producto/<id>.svg?c=<categoría>).
 * Antes iban dentro del HTML: pesaban cientos de KB por página y se descargaban en cada visita.
 * Son determinísticas (misma semilla, mismo dibujo), así que se cachean por un año.
 */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string; seed: string }> }) {
  const { kind, seed: file } = await params
  const seed = file.replace(/\.svg$/, '')
  const cat = new URL(req.url).searchParams.get('c') || null
  if (!/^[\w-]{1,64}$/.test(seed) || (cat && !/^[a-z-]{1,32}$/.test(cat))) return new Response('No encontrado', { status: 404 })
  const svg = kind === 'producto' ? productArt(seed, cat) : kind === 'tienda' ? storeCover(seed, cat) : null
  if (!svg) return new Response('No encontrado', { status: 404 })
  return new Response(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
