import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { BRAND_RATIO } from '@/components/brand-assets'
import { LOCAL_UPLOAD_DIR } from './storage'

/** Imágenes para compartir (WhatsApp, Facebook, X…): 1200×630 con la identidad de Florece 13. */
export const OG_SIZE = { width: 1200, height: 630 }

const FONT_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'node_modules/@fontsource')
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 700 | 800; style: 'normal' }[]> | null = null
function fonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, 'archivo-black/files/archivo-black-latin-400-normal.woff')).then((data) => ({ name: 'Archivo Black', data, weight: 400 as const, style: 'normal' as const })),
    readFile(path.join(FONT_DIR, 'archivo/files/archivo-latin-500-normal.woff')).then((data) => ({ name: 'Archivo', data, weight: 500 as const, style: 'normal' as const })),
    readFile(path.join(FONT_DIR, 'archivo/files/archivo-latin-700-normal.woff')).then((data) => ({ name: 'Archivo', data, weight: 700 as const, style: 'normal' as const })),
    readFile(path.join(FONT_DIR, 'permanent-marker/files/permanent-marker-latin-400-normal.woff')).then((data) => ({ name: 'Marker', data, weight: 400 as const, style: 'normal' as const })),
  ])
  return fontsPromise
}

export const svgUri = (svg: string) => {
  const withNs = svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  return `data:image/svg+xml;base64,${Buffer.from(withNs).toString('base64')}`
}

/** Arte generativo rasterizado al tamaño de la tarjeta (Satori no respeta preserveAspectRatio="slice"). */
export async function artUri(svg: string) {
  const withNs = svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  const jpg = await sharp(Buffer.from(withNs), { density: 144 }).resize({ width: 1000, height: 1040, fit: 'cover' }).jpeg({ quality: 85 }).toBuffer()
  return `data:image/jpeg;base64,${jpg.toString('base64')}`
}

/** Archivos del logo (public/brand/*.png) como data URI, al alto pedido. */
const BRAND_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public/brand')
const brandCache = new Map<string, Promise<string>>()
function brandUri(name: 'lockup' | 'lockup-light' | 'logo' | 'logo-light', height: number) {
  const key = `${name}@${height}`
  if (!brandCache.has(key)) {
    brandCache.set(
      key,
      sharp(path.join(BRAND_DIR, `${name}.png`))
        .resize({ height: Math.round(height * 2) })
        .png()
        .toBuffer()
        .then((b) => `data:image/png;base64,${b.toString('base64')}`),
    )
  }
  return brandCache.get(key)!
}

/** Foto de un producto/tienda como data URI JPEG (Satori no lee WebP). */
export async function photoUri(url: string | null | undefined, width = 700) {
  if (!url) return null
  try {
    let input: Buffer
    if (url.startsWith('/media/')) {
      const file = path.join(LOCAL_UPLOAD_DIR, ...url.replace('/media/', '').split('/'))
      if (!file.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return null
      input = await readFile(file)
    } else if (/^https?:\/\//.test(url)) {
      const res = await fetch(url)
      if (!res.ok) return null
      input = Buffer.from(await res.arrayBuffer())
    } else return null
    const jpg = await sharp(input).resize({ width, height: width, fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
    return `data:image/jpeg;base64,${jpg.toString('base64')}`
  } catch {
    return null
  }
}

async function lockup(tone: 'dark' | 'light', height: number) {
  const src = await brandUri(tone === 'light' ? 'lockup-light' : 'lockup', height)
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={src} width={Math.round(height * BRAND_RATIO.lockup)} height={height} />
}

const Band = () => (
  <div style={{ display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, height: 14 }}>
    {['#E5379B', '#FF8A00', '#17BEBB', '#2ECC71'].map((c) => (
      <div key={c} style={{ flex: 1, background: c }} />
    ))}
  </div>
)

/** Portada del sitio: el logo completo sobre cemento y el lema. */
export async function siteImage({ domain }: { domain: string }) {
  const logoH = 520
  const logo = await brandUri('logo-light', logoH)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#1F1D1B', position: 'relative', fontFamily: 'Archivo', padding: '0 64px 14px 56px', gap: 48 }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logo} width={Math.round(logoH * BRAND_RATIO.logo)} height={logoH} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 18 }}>
          <span style={{ fontFamily: 'Marker', fontSize: 36, color: '#FF8A00', transform: 'rotate(-3deg)' }}>¡hecho en la 13!</span>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Archivo Black', fontSize: 68, lineHeight: 0.98, color: '#F7F3EE', letterSpacing: -2 }}>
            <span>Del barrio,</span>
            <span>para todo</span>
            <span style={{ color: '#2ECC71' }}>el país.</span>
          </div>
          <span style={{ fontSize: 26, fontWeight: 500, color: '#BDB5A9', lineHeight: 1.35 }}>Artesanías, ropa, arte y sabores de la Comuna 13, directo de quienes los hacen.</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#F7F3EE', marginTop: 6 }}>{domain}</span>
        </div>
        <Band />
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}

/** Tarjeta de tienda o producto: texto a la izquierda, imagen a la derecha. */
export async function cardImage({
  eyebrow,
  title,
  subtitle,
  chips = [],
  price,
  image,
  accent = '#128C4B',
  domain,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  chips?: string[]
  price?: string
  image: string
  accent?: string
  domain: string
}) {
  const t = title.length > 60 ? title.slice(0, 57) + '…' : title
  const s = subtitle && subtitle.length > 110 ? subtitle.slice(0, 107) + '…' : subtitle
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#F7F3EE', position: 'relative', fontFamily: 'Archivo', padding: 48, gap: 48 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontFamily: 'Marker', fontSize: 30, color: accent, transform: 'rotate(-3deg)' }}>{eyebrow}</span>
            <span style={{ fontFamily: 'Archivo Black', fontSize: t.length > 30 ? 56 : 68, lineHeight: 1.02, color: '#1F1D1B', letterSpacing: -1.5 }}>{t}</span>
            {s && <span style={{ fontSize: 28, fontWeight: 500, color: '#4A443D', lineHeight: 1.35 }}>{s}</span>}
            {price && <span style={{ fontFamily: 'Archivo Black', fontSize: 52, color: '#128C4B' }}>{price}</span>}
            {chips.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {chips.map((c) => (
                  <span key={c} style={{ fontSize: 22, fontWeight: 700, color: '#4A443D', background: '#FFFDF9', border: '2px solid #E6DDD1', borderRadius: 999, padding: '8px 18px' }}>{c}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {await lockup('dark', 64)}
            <span style={{ fontSize: 22, fontWeight: 700, color: '#6B6259' }}>{domain}</span>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={image} width={500} height={520} style={{ borderRadius: 36, objectFit: 'cover', boxShadow: '0 20px 40px rgba(60,40,20,.25)' }} />
        <Band />
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}

/** Pantalla de arranque de iOS (apple-touch-startup-image): se ve mientras abre la app instalada. */
export async function splashImage(width: number, height: number) {
  const logoW = Math.round(width * 0.62)
  const logoH = Math.round(logoW / BRAND_RATIO.logo)
  const logo = await brandUri('logo', logoH / 2)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F3EE' }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logo} width={logoW} height={logoH} style={{ marginTop: -Math.round(height * 0.04) }} />
      </div>
    ),
    { width, height },
  )
}

/** PNG → JPEG: WhatsApp a veces no muestra vistas previas de más de ~300 KB. */
export async function asJpeg(res: Response, quality = 84) {
  const jpg = await sharp(Buffer.from(await res.arrayBuffer())).flatten({ background: '#F7F3EE' }).jpeg({ quality, mozjpeg: true }).toBuffer()
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': res.headers.get('Cache-Control') ?? 'public, max-age=3600' } })
}

/** Recuadro con el logo completo, para cuando no hay fotos (misma proporción que la imagen de las tarjetas). */
let logoTile: Promise<string> | null = null
export function logoTileUri() {
  logoTile ??= (async () => {
    const logo = await sharp(path.join(BRAND_DIR, 'logo.png')).resize({ height: 800 }).toBuffer()
    const bg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1040"><defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#FFFDF9"/><stop offset="1" stop-color="#FCE4F1"/></radialGradient></defs><rect width="1000" height="1040" fill="url(#g)"/></svg>`,
    )
    const jpg = await sharp(bg).composite([{ input: logo, gravity: 'center' }]).jpeg({ quality: 86 }).toBuffer()
    return `data:image/jpeg;base64,${jpg.toString('base64')}`
  })()
  return logoTile
}
