import 'server-only'
import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { cache } from 'react'
import { db, deals, events, jobs, stores, stories } from '@/db'

/* Lo que está pasando: ofertas Flash vigentes, agenda, vacantes e historias de las últimas 24 h. */

const storeCols = {
  storeId: stores.id,
  storeSlug: stores.slug,
  storeName: stores.name,
  storeLogo: stores.logoUrl,
  storeSector: stores.sector,
  storeWhatsapp: stores.whatsapp,
  lat: stores.lat,
  lng: stores.lng,
}

export const activeDeals = cache(async (limit = 40) => {
  const now = new Date()
  return db
    .select({
      id: deals.id,
      title: deals.title,
      description: deals.description,
      imageUrl: deals.imageUrl,
      price: deals.price,
      originalPrice: deals.originalPrice,
      endsAt: deals.endsAt,
      ...storeCols,
    })
    .from(deals)
    .innerJoin(stores, eq(stores.id, deals.storeId))
    .where(and(eq(stores.status, 'ACTIVE'), gt(deals.endsAt, now), lt(deals.startsAt, now)))
    .orderBy(asc(deals.endsAt))
    .limit(limit)
})
export type DealItem = Awaited<ReturnType<typeof activeDeals>>[number]

export async function listEvents(opts: { from?: Date; to?: Date; kind?: string; limit?: number } = {}) {
  const from = opts.from ?? new Date()
  // Se muestra si se cruza con el rango; sin hora de fin, se asume que dura 3 horas.
  const where = [eq(stores.status, 'ACTIVE'), sql`coalesce(${events.endsAt}, ${events.startsAt} + interval '3 hours') > ${from.toISOString()}`]
  if (opts.to) where.push(lt(events.startsAt, opts.to))
  if (opts.kind) where.push(eq(events.category, opts.kind))
  return db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      imageUrl: events.imageUrl,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      place: events.place,
      price: events.price,
      category: events.category,
      ...storeCols,
    })
    .from(events)
    .innerJoin(stores, eq(stores.id, events.storeId))
    .where(and(...where))
    .orderBy(asc(events.startsAt))
    .limit(opts.limit ?? 60)
}
export type EventItem = Awaited<ReturnType<typeof listEvents>>[number]

export async function activeJobs(limit = 60) {
  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      schedule: jobs.schedule,
      pay: jobs.pay,
      createdAt: jobs.createdAt,
      ...storeCols,
    })
    .from(jobs)
    .innerJoin(stores, eq(stores.id, jobs.storeId))
    .where(and(eq(stores.status, 'ACTIVE'), gt(jobs.expiresAt, new Date())))
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
}
export type JobItem = Awaited<ReturnType<typeof activeJobs>>[number]

/** Historias vigentes agrupadas por negocio (el más reciente primero). */
export const activeStories = cache(async () => {
  const rows = await db
    .select({
      id: stories.id,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      caption: stories.caption,
      createdAt: stories.createdAt,
      ...storeCols,
    })
    .from(stories)
    .innerJoin(stores, eq(stores.id, stories.storeId))
    .where(and(eq(stores.status, 'ACTIVE'), gt(stories.expiresAt, new Date())))
    .orderBy(desc(stories.createdAt))
  const groups = new Map<string, { store: { id: string; slug: string; name: string; logo: string | null }; items: { id: string; mediaUrl: string; mediaType: string; caption: string; createdAt: string }[] }>()
  for (const r of rows) {
    const g = groups.get(r.storeId) ?? { store: { id: r.storeId, slug: r.storeSlug, name: r.storeName, logo: r.storeLogo }, items: [] }
    g.items.push({ id: r.id, mediaUrl: r.mediaUrl, mediaType: r.mediaType, caption: r.caption, createdAt: r.createdAt.toISOString() })
    groups.set(r.storeId, g)
  }
  // Dentro de cada negocio, de la más vieja a la más nueva (como se ven las historias).
  return [...groups.values()].map((g) => ({ ...g, items: g.items.reverse() }))
})
export type StoryGroup = Awaited<ReturnType<typeof activeStories>>[number]
