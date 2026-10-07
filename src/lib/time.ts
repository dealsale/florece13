import type { StoreHours } from '@/db/schema'

/* Todo en hora de Colombia (UTC−5, sin horario de verano). Sirve en el servidor y en el navegador. */

const OFFSET_MS = -5 * 3600_000
/** Fecha "de pared" en Bogotá (los getUTC* devuelven la hora local de Colombia). */
export const bogota = (d = new Date()) => new Date(d.getTime() + OFFSET_MS)
/** De una fecha/hora de pared en Bogotá al instante real. */
export const fromBogota = (y: number, m: number, d: number, h = 0, min = 0) => new Date(Date.UTC(y, m, d, h, min) - OFFSET_MS)

/** 0 = lunes … 6 = domingo */
export const weekdayBogota = (d = new Date()) => (bogota(d).getUTCDay() + 6) % 7
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** ¿Está abierto ahora? null si la tienda no publicó horario. */
export function openStatus(hours: StoreHours | null | undefined, at = new Date()): { open: boolean; label: string } | null {
  if (!hours || hours.length !== 7) return null
  const b = bogota(at)
  const now = b.getUTCHours() * 60 + b.getUTCMinutes()
  const today = weekdayBogota(at)
  const yesterday = (today + 6) % 7
  const y = hours[yesterday]
  // Abierto desde ayer, pasada la medianoche (p. ej. bar de 18:00 a 02:00).
  if (y && !y.closed && minutes(y.close) < minutes(y.open) && now < minutes(y.close)) return { open: true, label: `Abierto hasta las ${y.close}` }
  const t = hours[today]
  if (t && !t.closed) {
    const o = minutes(t.open)
    const c = minutes(t.close)
    const overnight = c <= o
    if (now >= o && (overnight || now < c)) return { open: true, label: `Abierto hasta las ${t.close}` }
    if (now < o) return { open: false, label: `Abre hoy a las ${t.open}` }
  }
  for (let i = 1; i <= 7; i++) {
    const d = hours[(today + i) % 7]
    if (d && !d.closed) return { open: false, label: i === 1 ? `Abre mañana a las ${d.open}` : `Abre el ${DAY_NAMES[(today + i) % 7].toLowerCase()}` }
  }
  return { open: false, label: 'Cerrado' }
}

/** Fin del día de hoy en Bogotá (23:59). */
export function endOfTodayBogota(at = new Date()) {
  const b = bogota(at)
  return fromBogota(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), 23, 59)
}

/** Rangos para la Agenda: hoy, mañana, fin de semana (viernes 18:00 a domingo). */
export function agendaRange(when: 'hoy' | 'manana' | 'finde', at = new Date()): [Date, Date] {
  const b = bogota(at)
  const y = b.getUTCFullYear()
  const m = b.getUTCMonth()
  const d = b.getUTCDate()
  if (when === 'hoy') return [at, fromBogota(y, m, d + 1)]
  if (when === 'manana') return [fromBogota(y, m, d + 1), fromBogota(y, m, d + 2)]
  const wd = weekdayBogota(at)
  const toFri = (4 - wd + 7) % 7
  const start = wd >= 4 ? at : fromBogota(y, m, d + toFri, 18)
  return [start, fromBogota(y, m, d + (6 - wd) + 1)]
}

/** "quedan 47 min", "quedan 2 h 10 min" */
export function timeLeft(end: Date, at = new Date()) {
  const ms = end.getTime() - at.getTime()
  if (ms <= 0) return 'terminó'
  const mins = Math.ceil(ms / 60000)
  if (mins < 60) return `quedan ${mins} min`
  const h = Math.floor(mins / 60)
  const r = mins % 60
  return `quedan ${h} h${r ? ` ${r} min` : ''}`
}

const dayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
const hourFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })
/** "Hoy, 7:00 p. m." / "Mañana, 3:00 p. m." / "sáb, 12 oct, 3:00 p. m." */
export function whenLabel(d: Date, at = new Date()) {
  const diff = Math.round((bogota(d).setUTCHours(0, 0, 0, 0) - bogota(at).setUTCHours(0, 0, 0, 0)) / 86400000)
  const day = diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : dayFmt.format(d)
  return `${day}, ${hourFmt.format(d)}`
}
export const hourLabel = (d: Date) => hourFmt.format(d)
