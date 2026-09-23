/**
 * Ilustraciones de marca generadas en SVG (sin fotos de stock, como pide el briefing):
 * la ladera de casitas de la 13, la escalera eléctrica, la flor del logo y
 * un arte por categoría para productos que todavía no tienen foto.
 * Todo es determinístico: la misma semilla dibuja siempre lo mismo.
 */

function hash(s: string) {
  let h = 2166136261
  for (const c of s) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: string) {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const CATEGORY_COLORS: Record<string, string> = {
  artesanias: '#E5379B',
  ropa: '#17BEBB',
  comida: '#FF8A00',
  arte: '#2ECC71',
  souvenirs: '#9C4A2F',
  servicios: '#6B5BD2',
}
const CATEGORY_TINTS: Record<string, string> = {
  artesanias: '#FCE4F1',
  ropa: '#D6F4F3',
  comida: '#FFEBD2',
  arte: '#DDF6E7',
  souvenirs: '#F3E0D8',
  servicios: '#E7E4F6',
}

/** La flor del logo (ruta B), centrada en 0,0. */
export function flower(cls = '') {
  return `<g class="${cls}"><circle cy="-11" r="9" fill="#E5379B"/><circle cx="10" cy="4" r="9" fill="#FF8A00"/><circle cx="-10" cy="4" r="9" fill="#17BEBB"/><circle cy="-2" r="6.5" fill="#2ECC71"/></g>`
}

const HOUSE_COLORS = ['#E5379B', '#FF8A00', '#17BEBB', '#2ECC71', '#9C4A2F', '#F2C94C', '#128C4B', '#F7F3EE', '#C0506B']

/** La ladera: tres filas de casas de colores apiladas en la loma. */
export function ladera(
  seed: string,
  { w = 1200, h = 300, anim = false, sky, flowerAt }: { w?: number; h?: number; anim?: boolean; sky?: string; flowerAt?: [number, number, number] } = {},
) {
  const r = rng(seed)
  let out = ''
  let i = 0
  const rows = [
    { base: h * 0.55, scale: 0.62, light: true },
    { base: h * 0.8, scale: 0.85, light: false },
    { base: h + 6, scale: 1, light: false },
  ]
  for (const row of rows) {
    let x = -20 - r() * 40
    while (x < w + 20) {
      const hw = (46 + r() * 50) * row.scale
      const hh = (50 + r() * 90) * row.scale
      const slope = Math.sin((x / w) * Math.PI) * h * 0.18
      const y = row.base - hh - slope
      const col = HOUSE_COLORS[Math.floor(r() * HOUSE_COLORS.length)]
      let wins = ''
      const cols = Math.max(1, Math.floor(hw / 18))
      const rws = Math.max(1, Math.floor(hh / 26))
      for (let a = 0; a < cols; a++)
        for (let b = 0; b < rws; b++) {
          if (r() < 0.35) continue
          const lit = r() < 0.55
          wins += `<rect ${anim && lit ? `class="win" style="--d:${(r() * 5).toFixed(2)}"` : ''} x="${(x + 6 + a * ((hw - 12) / cols)).toFixed(1)}" y="${(y + 8 + b * ((hh - 14) / rws)).toFixed(1)}" width="${(Math.min(9, hw / cols - 6) * row.scale + 2).toFixed(1)}" height="${(9 * row.scale + 2).toFixed(1)}" rx="1.5" fill="${lit ? '#FFE9A8' : 'rgba(31,29,27,.35)'}"/>`
        }
      const roof = r() < 0.4 ? `<rect x="${(x - 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="${(hw + 4).toFixed(1)}" height="6" fill="#9C4A2F"/>` : ''
      out += `<g ${anim ? `class="house" style="--i:${i}"` : ''} ${row.light ? 'opacity=".55"' : ''}><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${hw.toFixed(1)}" height="${(h - y + 10).toFixed(1)}" fill="${col}"/>${roof}${wins}</g>`
      x += hw + 2 + r() * 6
      i++
    }
  }
  const fl = flowerAt
    ? `<g transform="translate(${flowerAt[0]},${flowerAt[1]}) scale(${flowerAt[2]})"><path class="sway" d="M0 30 C 4 60, -4 90, 0 130" stroke="#2ECC71" stroke-width="5" fill="none"/>${flower(anim ? 'bloom' : '')}</g>`
    : ''
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${sky ? `<rect width="${w}" height="${h}" fill="${sky}"/>` : ''}${fl}${out}</svg>`
}

/** Portada por defecto de una tienda sin foto. */
export function storeCover(seed: string, categorySlug?: string | null) {
  return ladera(seed, { w: 800, h: 500, sky: CATEGORY_TINTS[categorySlug ?? ''] ?? '#FFEBD2' })
}

/** Escalera eléctrica: peldaños que suben. */
export function stairs(color = '#2ECC71', n = 6, w = 300, h = 200) {
  let d = `M0 ${h}`
  for (let k = 0; k < n; k++) {
    const x = (k * w) / n
    const y = h - ((k + 1) * h) / n
    d += ` L${x} ${y} L${x + w / n} ${y}`
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><path d="${d} L${w} ${h} Z" fill="${color}"/></svg>`
}

const PAL: [string, string][] = [
  ['#E5379B', '#FCE4F1'],
  ['#FF8A00', '#FFEBD2'],
  ['#17BEBB', '#D6F4F3'],
  ['#2ECC71', '#DDF6E7'],
  ['#9C4A2F', '#F3E0D8'],
  ['#128C4B', '#E3F4E9'],
  ['#6B5BD2', '#E7E4F6'],
]

/** Arte estilo mural por categoría, para productos sin foto. */
export function productArt(seed: string, categorySlug?: string | null) {
  const r = rng(seed)
  const pick = () => PAL[Math.floor(r() * PAL.length)]
  const [main, bg] = pick()
  let [acc] = pick()
  if (acc === main) acc = '#1F1D1B'
  const [acc2] = pick()
  let m = ''
  switch (categorySlug) {
    case 'artesanias': {
      const bands = [main, acc, acc2, '#1F1D1B']
      for (let k = 0; k < 7; k++) {
        const y = 70 + k * 26
        let pts = ''
        for (let x = 0; x <= 400; x += 20) pts += `${x},${y + ((x / 20) % 2 ? 12 : 0)} `
        m += `<polyline points="${pts}" fill="none" stroke="${bands[k % 4]}" stroke-width="9" stroke-linejoin="round"/>`
      }
      m = `<g opacity=".25">${m}</g><path d="M130 190 Q200 90 270 190" fill="none" stroke="#1F1D1B" stroke-width="10"/><rect x="110" y="190" width="180" height="200" rx="26" fill="${main}"/>`
      for (let k = 0; k < 5; k++) {
        let pts = ''
        for (let x = 110; x <= 290; x += 18) pts += `${x},${222 + k * 34 + ((x / 18) % 2 ? 10 : 0)} `
        m += `<polyline points="${pts}" fill="none" stroke="${[acc, '#F7F3EE', acc2][k % 3]}" stroke-width="6"/>`
      }
      break
    }
    case 'ropa':
      m = `<circle cx="${140 + r() * 120}" cy="160" r="120" fill="${acc}" opacity=".85"/><path d="M130 150 L90 185 L118 225 L140 212 L140 380 L260 380 L260 212 L282 225 L310 185 L270 150 Q200 180 130 150Z" fill="${main}"/><path d="M175 150 Q200 175 225 150" fill="none" stroke="#1F1D1B" stroke-width="6"/><rect x="140" y="260" width="120" height="16" fill="${acc2}"/><rect x="140" y="290" width="120" height="8" fill="#F7F3EE"/>`
      break
    case 'comida':
      m = `<circle cx="200" cy="330" r="130" fill="${acc}" opacity=".35"/><ellipse cx="200" cy="370" rx="130" ry="26" fill="#F7F3EE"/><path d="M120 230 H280 V330 Q280 370 240 370 H160 Q120 370 120 330Z" fill="${main}"/><path d="M280 250 Q330 255 325 295 Q320 330 280 325" fill="none" stroke="${main}" stroke-width="14"/><rect x="120" y="258" width="160" height="14" fill="${acc2}"/>`
      for (let k = 0; k < 3; k++)
        m += `<path d="M${165 + k * 35} 210 q-18 -30 0 -60 q18 -30 0 -60" fill="none" stroke="#1F1D1B" stroke-width="7" stroke-linecap="round" opacity=".55"/>`
      break
    case 'arte':
      for (let k = 0; k < 5; k++) {
        const cx = 60 + r() * 280
        const cy = 80 + r() * 260
        const rr = 40 + r() * 70
        const c = [main, acc, acc2, '#1F1D1B', '#F7F3EE'][k]
        m += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${c}" opacity=".9"/><rect x="${cx - 6}" y="${cy + rr * 0.6}" width="12" height="${40 + r() * 80}" rx="6" fill="${c}"/>`
      }
      break
    case 'souvenirs': {
      let d = 'M20 440'
      for (let k = 0; k < 7; k++) {
        const x = 20 + k * 52
        const y = 440 - (k + 1) * 44
        d += ` L${x} ${y} L${x + 52} ${y}`
      }
      m = `<path d="${d} L384 440Z" fill="${main}"/><path d="${d}" fill="none" stroke="#1F1D1B" stroke-width="6"/><g transform="translate(330,90) scale(2.6)">${flower()}</g><path d="M330 120 V160" stroke="#128C4B" stroke-width="8"/>`
      break
    }
    default:
      for (let a = 0; a < 7; a++)
        for (let b = 0; b < 8; b++)
          m += `<circle cx="${40 + a * 54}" cy="${50 + b * 58}" r="${6 + r() * 14}" fill="${[main, acc, acc2][(a + b) % 3]}" opacity=".85"/>`
  }
  let spray = ''
  for (let k = 0; k < 40; k++)
    spray += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 500).toFixed(0)}" r="${(r() * 3 + 0.6).toFixed(1)}" fill="#1F1D1B" opacity=".18"/>`
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="500" fill="${bg}"/>${m}${spray}</svg>`
}
