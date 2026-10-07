'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { deals, db, events, jobs, stories } from '@/db'
import { requireMerchant } from '@/lib/auth'
import { EVENT_KINDS } from '@/lib/agenda'
import { notifyFollowers, notifyNearDeal, safeNotify } from '@/lib/notify'
import { isOwnMediaUrl } from '@/lib/storage'
import { endOfTodayBogota, fromBogota } from '@/lib/time'
import type { FormState } from './merchant'

/* Lo "en vivo" de cada negocio: ofertas Flash, eventos, vacantes e historias. */

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const money = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d ? Number(d) : null
}
const image = z
  .string()
  .refine((v) => v === '' || isOwnMediaUrl(v), 'Foto inválida.')
  .transform((v) => v || null)

/** "2026-10-10T19:00" (hora de Colombia) → instante real */
function localDateTime(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v)
  return m ? fromBogota(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null
}

const done = (path: string, message: string): FormState => {
  revalidatePath('/', 'layout')
  revalidatePath(path)
  return { ok: true, message }
}

/* ---------- Florece Flash ---------- */

const dealSchema = z.object({
  title: z.string().min(3, 'Escribí qué ofrecés.').max(80),
  description: z.string().max(300),
  imageUrl: image,
  price: z.number({ error: 'Escribí el precio de la oferta.' }).int().min(500, 'El precio mínimo es $ 500.').max(100_000_000),
  originalPrice: z.number().int().positive().nullable(),
  duration: z.enum(['1h', '3h', 'hoy']),
})

export async function createDeal(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/hoy')
  const parsed = dealSchema.safeParse({
    title: str(fd, 'title'),
    description: str(fd, 'description'),
    imageUrl: str(fd, 'imageUrl'),
    price: money(str(fd, 'price')) ?? undefined,
    originalPrice: money(str(fd, 'originalPrice')),
    duration: str(fd, 'duration') || 'hoy',
  })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  const { duration, ...data } = parsed.data
  if (data.originalPrice !== null && data.originalPrice <= data.price) data.originalPrice = null
  const now = new Date()
  const endsAt = duration === '1h' ? new Date(now.getTime() + 3600_000) : duration === '3h' ? new Date(now.getTime() + 3 * 3600_000) : endOfTodayBogota(now)
  if (endsAt.getTime() - now.getTime() < 15 * 60_000) return { message: 'Queda muy poco del día: elegí 1 hora o 3 horas.' }
  const [deal] = await db.insert(deals).values({ ...data, storeId: store.id, endsAt }).returning({ id: deals.id })
  after(() =>
    safeNotify(async () => {
      await notifyFollowers(store.id, { title: `⚡ ${store.name}: ${data.title}`, body: `Florece Flash hasta las ${endsAt.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })}.`, url: `/ofertas#${deal.id}`, tag: `deal-${deal.id}` })
      await notifyNearDeal(store.id, deal.id)
    }),
  )
  return done('/panel/hoy', '¡Tu oferta Flash está al aire!')
}

/* ---------- Agenda ---------- */

const eventSchema = z.object({
  title: z.string().min(3, 'Escribí el nombre del evento.').max(100),
  description: z.string().max(1000),
  imageUrl: image,
  category: z.enum(EVENT_KINDS.map((k) => k.key) as [string, ...string[]]),
  startsAt: z.date({ error: 'Elegí la fecha y la hora.' }),
  endsAt: z.date().nullable(),
  place: z.string().max(140),
  price: z.number().int().min(0).max(10_000_000).nullable(),
})

export async function createEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/hoy')
  const parsed = eventSchema.safeParse({
    title: str(fd, 'title'),
    description: str(fd, 'description'),
    imageUrl: str(fd, 'imageUrl'),
    category: str(fd, 'category') || 'otros',
    startsAt: localDateTime(str(fd, 'startsAt')) ?? undefined,
    endsAt: str(fd, 'endsAt') ? localDateTime(str(fd, 'endsAt')) : null,
    place: str(fd, 'place'),
    price: money(str(fd, 'price')),
  })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  const data = parsed.data
  if (data.startsAt.getTime() < Date.now() - 3600_000) return { errors: { startsAt: ['La fecha ya pasó.'] } }
  if (data.endsAt && data.endsAt <= data.startsAt) data.endsAt = null
  if (data.price === 0) data.price = null
  const [ev] = await db.insert(events).values({ ...data, place: data.place || store.address, storeId: store.id }).returning({ id: events.id })
  after(() =>
    safeNotify(() =>
      notifyFollowers(store.id, { title: `🎫 ${store.name}: ${data.title}`, body: `Nuevo evento en la Agenda 13.`, url: `/eventos#${ev.id}`, tag: `event-${ev.id}` }),
    ),
  )
  return done('/panel/hoy', 'Evento publicado en la Agenda 13.')
}

/* ---------- Empleo ---------- */

const jobSchema = z.object({
  title: z.string().min(3, 'Escribí qué cargo buscás.').max(80),
  description: z.string().max(1000),
  schedule: z.string().max(40),
  pay: z.string().max(80),
})

export async function createJob(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/hoy')
  const parsed = jobSchema.safeParse({ title: str(fd, 'title'), description: str(fd, 'description'), schedule: str(fd, 'schedule'), pay: str(fd, 'pay') })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  await db.insert(jobs).values({ ...parsed.data, storeId: store.id, expiresAt: new Date(Date.now() + 30 * 86400_000) })
  return done('/panel/hoy', 'Vacante publicada por 30 días.')
}

/* ---------- Historias (24 h) ---------- */

const storySchema = z.object({
  mediaUrl: z.string().refine(isOwnMediaUrl, 'Subí una foto o un video.'),
  mediaType: z.enum(['image', 'video']),
  caption: z.string().max(140),
})

export async function createStory(_prev: FormState, fd: FormData): Promise<FormState> {
  const { store } = await requireMerchant('/panel/hoy')
  const parsed = storySchema.safeParse({ mediaUrl: str(fd, 'mediaUrl'), mediaType: str(fd, 'mediaType') || 'image', caption: str(fd, 'caption') })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Subí una foto o un video.' }
  await db.insert(stories).values({ ...parsed.data, storeId: store.id, expiresAt: new Date(Date.now() + 24 * 3600_000) })
  after(() => safeNotify(() => notifyFollowers(store.id, { title: `${store.name} publicó una historia`, body: parsed.data.caption || 'Mirala antes de que desaparezca.', url: `/?historia=${store.slug}`, tag: `story-${store.id}` })))
  return done('/panel/hoy', 'Tu historia está publicada por 24 horas.')
}

/* ---------- borrar ---------- */

const TABLES = { deal: deals, event: events, job: jobs, story: stories } as const

export async function removeLive(kind: keyof typeof TABLES, id: string) {
  const { store } = await requireMerchant('/panel/hoy')
  const t = TABLES[kind]
  if (!t || !/^[0-9a-f-]{36}$/i.test(id)) return
  await db.delete(t).where(and(eq(t.id, id), eq(t.storeId, store.id)))
  revalidatePath('/', 'layout')
}
