import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { MARK_VIEWBOX as V, FLOWER, PETALS, THIRTEEN_PATH } from '@/components/logo-geometry'
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

function markSvg(tone: 'dark' | 'light') {
  const ink = tone === 'light' ? '#F7F3EE' : '#1F1D1B'
  const petals = PETALS.map((p) => `<circle cx="${FLOWER.cx + p.dx}" cy="${FLOWER.cy + p.dy}" r="${p.r}" fill="${p.color}"/>`).join('')
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${V.x} ${V.y} ${V.w} ${V.h}"><path d="${THIRTEEN_PATH}" fill="${ink}"/>${petals}</svg>`)
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

function Logo({ tone = 'dark', size = 46 }: { tone?: 'dark' | 'light'; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: size * 0.12 }}>
      <span style={{ fontFamily: 'Archivo Black', fontSize: size * 0.62, color: tone === 'light' ? '#F7F3EE' : '#1F1D1B', letterSpacing: -1 }}>Florece</span>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={markSvg(tone)} width={(size * V.w) / V.h} height={size} />
    </div>
  )
}

const Band = () => (
  <div style={{ display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, height: 14 }}>
    {['#E5379B', '#FF8A00', '#17BEBB', '#2ECC71'].map((c) => (
      <div key={c} style={{ flex: 1, background: c }} />
    ))}
  </div>
)

/** Portada del sitio: fondo cemento, ladera y el lema. */
export async function siteImage({ ladera, domain }: { ladera: string; domain: string }) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1F1D1B', position: 'relative', fontFamily: 'Archivo' }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={svgUri(ladera)} width={1200} height={300} style={{ position: 'absolute', left: 0, bottom: 14 }} />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '56px 72px', gap: 14 }}>
          <Logo tone="light" size={52} />
          <span style={{ fontFamily: 'Marker', fontSize: 34, color: '#FF8A00', transform: 'rotate(-3deg)', marginTop: 18 }}>¡hecho en la 13!</span>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Archivo Black', fontSize: 78, lineHeight: 0.95, color: '#F7F3EE', letterSpacing: -2 }}>
            <span>Del barrio, para</span>
            <span style={{ color: '#2ECC71' }}>todo el país.</span>
          </div>
        </div>
        <span style={{ position: 'absolute', right: 72, top: 64, fontSize: 26, fontWeight: 700, color: '#D8D0C4' }}>{domain}</span>
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
            <Logo size={44} />
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
export async function splashImage(width: number, height: number, ladera: string) {
  const u = Math.min(width, height) / 100
  const laderaH = Math.round(width * 0.42)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F3EE', position: 'relative', fontFamily: 'Archivo' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: u * 30, height: u * 30, borderRadius: u * 7, background: '#222222', marginTop: -laderaH * 0.5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={markSvg('light')} width={u * 22} height={(u * 22 * V.h) / V.w} />
        </div>
        <span style={{ fontFamily: 'Archivo Black', fontSize: u * 9, color: '#1F1D1B', marginTop: u * 6, letterSpacing: -u * 0.2 }}>Florece 13</span>
        <span style={{ fontFamily: 'Marker', fontSize: u * 5.4, color: '#B4127A', marginTop: u * 1.5, transform: 'rotate(-3deg)' }}>¡hecho en la 13!</span>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={svgUri(ladera)} width={width} height={laderaH} style={{ position: 'absolute', left: 0, bottom: 0 }} />
      </div>
    ),
    { width, height, fonts: await fonts() },
  )
}
