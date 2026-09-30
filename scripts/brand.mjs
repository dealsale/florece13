// Genera los archivos del logo a partir del arte original (brand/logo-original.jpg).
//
//   node scripts/brand.mjs
//
// El original es un JPG sobre fondo crema. Acá se le quita el fondo y se separan sus piezas:
//   - el 13 ilustrado (símbolo)
//   - la palabra "Florece" con su subrayado y la salpicadura (en azul noche, se identifica por color)
// y con eso se arman el lockup completo, el horizontal (para el encabezado) y los íconos de la app.
// Los archivos quedan en public/brand y public/icons y se versionan en el repo.
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const SRC = 'brand/logo-original.jpg'
const OUT = 'public/brand'
const ICONS = 'public/icons'
const HUESO = [247, 243, 238]
const NAVY = [8, 29, 46]

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height
const C = info.channels

// Color de fondo: promedio de las esquinas.
const corner = (x, y) => [0, 1, 2].map((k) => data[(y * W + x) * C + k])
const BG = [0, 1, 2].map((k) => Math.round((corner(3, 3)[k] + corner(W - 4, 3)[k] + corner(3, H - 4)[k] + corner(W - 4, H - 4)[k]) / 4))

const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
const clamp01 = (v) => Math.max(0, Math.min(1, v))

// Zonas del original (1254×1254): el 13 ocupa hasta y≈805; "Florece" empieza en y≈712 y se cruza con la base del 13.
const WORD_TOP = 712
const MARK_BOTTOM = 805
const inSplash = (x, y) => (x >= 930 && y >= 735 && y <= 845) || (x >= 975 && y >= 690 && y <= 845)
// Sobre la base del 3 no hay letras altas: a la derecha de la "l" la palabra empieza más abajo.
const wordTop = (x) => (x < 520 ? WORD_TOP : 820)
const TAGLINE_TOP = 1042

/** Quita el fondo: alfa según la distancia al crema y color "des-mezclado" en los bordes. */
function unmix(p) {
  const a = clamp01((dist(p, BG) - 10) / 70)
  if (a === 0) return [0, 0, 0, 0]
  const c = p.map((v, k) => Math.round(Math.max(0, Math.min(255, (v - BG[k] * (1 - a)) / a))))
  return [...c, Math.round(a * 255)]
}
/** Qué tanto se parece al azul noche de las letras (1 = igual). */
const navyness = (p) => clamp01(1 - (dist(p, NAVY) - 70) / 80)

const saturation = (p) => {
  const mx = Math.max(p[0], p[1], p[2])
  const mn = Math.min(p[0], p[1], p[2])
  return mx === 0 ? 0 : (mx - mn) / mx
}

/** Borra manchitas sueltas (componentes de menos de `minArea` píxeles). */
function dropSpecks(out, minArea) {
  const seen = new Uint8Array(W * H)
  const stack = []
  for (let start = 0; start < W * H; start++) {
    if (seen[start] || out[start * 4 + 3] < 30) continue
    const comp = []
    stack.push(start)
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop()
      comp.push(i)
      const x = i % W
      const y = (i - x) / W
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const j = ny * W + nx
        if (!seen[j] && out[j * 4 + 3] >= 30) {
          seen[j] = 1
          stack.push(j)
        }
      }
    }
    if (comp.length < minArea) for (const i of comp) out[i * 4 + 3] = 0
  }
  // Los bordes suaves que quedaron alrededor de lo borrado.
  for (let i = 0; i < W * H; i++) if (out[i * 4 + 3] < 30 && !seen[i]) out[i * 4 + 3] = 0
}

function layer(pick, minArea = 0) {
  const out = Buffer.alloc(W * H * 4)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      const p = [data[i], data[i + 1], data[i + 2]]
      const px = pick(x, y, p)
      if (px) px.forEach((v, k) => (out[(y * W + x) * 4 + k] = v))
    }
  if (minArea) dropSpecks(out, minArea)
  return sharp(out, { raw: { width: W, height: H, channels: 4 } })
}

// El 13: todo lo que está arriba, sin las letras que se le cruzan ni la salpicadura.
const mark = layer((x, y, p) => {
  if (y > MARK_BOTTOM || inSplash(x, y)) return null
  const px = unmix(p)
  if (y >= WORD_TOP) px[3] = Math.round(px[3] * (1 - navyness(px)))
  // Trazos grises del pincel de las letras (el 13 abajo es follaje: siempre saturado).
  if (y >= 740 && saturation(px) < 0.3) return null
  return px
}, 600)

// "Florece" (+ subrayado y salpicadura), sin el lema de abajo. `ink` cambia el azul noche (versión clara).
const wordmark = (ink) =>
  layer((x, y, p) => {
    if (y >= TAGLINE_TOP) return null
    const splash = inSplash(x, y)
    if (!splash && y < wordTop(x)) return null
    const px = unmix(p)
    if (px[3] === 0) return null
    const underline = y >= 990
    if (splash) return saturation(px) > 0.45 && navyness(px) < 0.3 ? px : null
    if (underline) {
      if (ink && navyness(px) > 0.5) return [...ink, px[3]]
      return px
    }
    const n = navyness(px)
    if (n === 0) return null
    return [...(ink ?? NAVY), Math.round(px[3] * n)]
  }, 400)

// Logo completo; en la versión clara, las letras de abajo pasan a crema.
const full = (ink) =>
  layer((x, y, p) => {
    const px = unmix(p)
    // Las letras (y la parte de la F y la l que se cruza con el 1). El contorno oscuro del 3 queda igual.
    const lettersZone = y > MARK_BOTTOM || (y >= WORD_TOP && x < 520)
    if (ink && lettersZone && !inSplash(x, y) && px[3] > 0 && navyness(px) > 0.4) {
      return [...ink, px[3]]
    }
    return px
  })

async function trimmed(img) {
  const buf = await img.png().toBuffer()
  return sharp(buf).trim({ threshold: 1 }).png().toBuffer()
}

await mkdir(OUT, { recursive: true })
await mkdir(ICONS, { recursive: true })

const markPng = await trimmed(mark)
const wordPng = await trimmed(wordmark(null))
const wordLightPng = await trimmed(wordmark(HUESO))
const fullPng = await trimmed(full(null))
const fullLightPng = await trimmed(full(HUESO))

const save = (buf, name, width) => sharp(buf).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9, palette: false }).toFile(`${OUT}/${name}`)
await save(markPng, 'mark.png', 480)
await save(fullPng, 'logo.png', 900)
await save(fullLightPng, 'logo-light.png', 900)
await save(wordPng, 'wordmark.png', 600)

// Lockup horizontal: [13] [Florece], la palabra a ~62 % de la altura del 13, centrada.
async function lockup(word, name) {
  const h = 240
  const m = await sharp(markPng).resize({ height: h }).toBuffer({ resolveWithObject: true })
  const w = await sharp(word).resize({ height: Math.round(h * 0.62) }).toBuffer({ resolveWithObject: true })
  const gap = Math.round(h * 0.08)
  const width = m.info.width + gap + w.info.width
  await sharp({ create: { width, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: m.data, left: 0, top: 0 },
      { input: w.data, left: m.info.width + gap, top: Math.round((h - w.info.height) / 2) + Math.round(h * 0.04) },
    ])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}`)
  return width / h
}
const ratio = await lockup(wordPng, 'lockup.png')
await lockup(wordLightPng, 'lockup-light.png')

// Íconos de la app: el 13 sobre crema. `pad` = margen por lado (maskable necesita más: zona segura del 80 %).
async function icon(size, pad, file) {
  const inner = Math.round(size * (1 - pad * 2))
  const m = await sharp(markPng).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer({ resolveWithObject: true })
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: HUESO[0], g: HUESO[1], b: HUESO[2], alpha: 1 } } })
    .composite([{ input: m.data, left: Math.round((size - m.info.width) / 2), top: Math.round((size - m.info.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(file)
}
await icon(512, 0.1, `${ICONS}/icon-512.png`)
await icon(192, 0.1, `${ICONS}/icon-192.png`)
await icon(512, 0.2, `${ICONS}/maskable-512.png`)
await icon(180, 0.12, `${ICONS}/apple-touch-icon.png`)

// Ícono de la barra de estado de Android para las notificaciones: silueta blanca del 13 (solo cuenta el alfa).
{
  const alpha = await sharp(markPng).resize({ width: 80, height: 80, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).extractChannel('alpha').toBuffer()
  const white = await sharp({ create: { width: 80, height: 80, channels: 3, background: '#FFFFFF' } }).joinChannel(alpha).png().toBuffer()
  await sharp({ create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: white, left: 8, top: 8 }])
    .png()
    .toFile(`${ICONS}/badge-96.png`)
}
await icon(48, 0.04, `${ICONS}/favicon-48.png`)
await icon(32, 0.02, `${ICONS}/favicon-32.png`)

// Versiones livianas para la web (WebP, el doble del tamaño en pantalla).
const webp = (file, resize, out) => sharp(`${OUT}/${file}`).resize(resize).webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/${out}`)
await webp('lockup.png', { height: 128 }, 'lockup.webp')
await webp('lockup-light.png', { height: 128 }, 'lockup-light.webp')
await webp('mark.png', { width: 256 }, 'mark.webp')

// favicon.ico con un PNG adentro (formato ICO moderno; lo aceptan todos los navegadores).
const fav = await sharp(`${ICONS}/favicon-48.png`).png().toBuffer()
const ico = Buffer.alloc(22)
ico.writeUInt16LE(0, 0)
ico.writeUInt16LE(1, 2)
ico.writeUInt16LE(1, 4)
ico.writeUInt8(48, 6)
ico.writeUInt8(48, 7)
ico.writeUInt16LE(1, 10)
ico.writeUInt16LE(32, 12)
ico.writeUInt32LE(fav.length, 14)
ico.writeUInt32LE(22, 18)
await writeFile('public/favicon.ico', Buffer.concat([ico, fav]))

// Proporciones para los componentes (ancho / alto).
const r = async (f) => {
  const m = await sharp(`${OUT}/${f}`).metadata()
  return +(m.width / m.height).toFixed(4)
}
await writeFile(
  'src/components/brand-assets.ts',
  `// Generado por scripts/brand.mjs — no editar a mano.\nexport const BRAND_RATIO = { lockup: ${await r('lockup.png')}, logo: ${await r('logo.png')}, mark: ${await r('mark.png')} }\n`,
)

console.log(`Logo listo. Proporción del lockup horizontal: ${ratio.toFixed(3)}`)
