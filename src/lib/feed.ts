import 'server-only'
import { sql } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '@/db'
import type { StoreHours } from '@/db/schema'
import { listProducts } from './queries'
import { openStatus } from './time'

/* Secciones del feed "Mi 13". Todo sale de datos reales; si una sección no tiene nada, no se muestra. */

/** Lo más pedido en los últimos 30 días (pedidos no cancelados). */
export const mostOrdered = cache(async (limit = 8) => {
  const rows = await db.execute<{ id: string }>(sql`
    select oi.product_id as id
    from order_items oi join orders o on o.id = oi.order_id
    where o.status <> 'CANCELADO' and o.created_at > now() - interval '30 days' and oi.product_id is not null
    group by oi.product_id order by sum(oi.quantity) desc limit ${limit}
  `)
  const ids = rows.map((r) => r.id)
  const items = await listProducts({ ids, limit })
  return ids.map((id) => items.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p))
})

/** Negocios que publicaron 2 o más cosas en las últimas 48 horas ("nueva colección"). */
export const newCollections = cache(async () => {
  const rows = await db.execute<{ slug: string; name: string; n: number; logo_url: string | null }>(sql`
    select s.slug, s.name, s.logo_url, count(*)::int as n
    from products p join stores s on s.id = p.store_id
    where s.status = 'ACTIVE' and p.created_at > now() - interval '48 hours'
    group by s.id having count(*) >= 2 order by max(p.created_at) desc limit 4
  `)
  return rows.map((r) => ({ slug: r.slug, name: r.name, n: Number(r.n), logo: r.logo_url }))
})

/** Servicios de negocios que están abiertos ahora (o que no publicaron horario). */
export const servicesAvailable = cache(async (limit = 8) => {
  const items = await listProducts({ kind: 'SERVICIO', limit: 40 })
  if (items.length === 0) return []
  const storeIds = [...new Set(items.map((i) => i.storeId))]
  const hours = await db.execute<{ id: string; hours: StoreHours | null }>(sql`select id, hours from stores where id in ${sql.raw(`(${storeIds.map((id) => `'${id.replace(/[^0-9a-f-]/gi, '')}'`).join(',')})`)}`)
  const openNow = new Map(hours.map((h) => [h.id, openStatus(h.hours)]))
  return items
    .map((p) => ({ p, st: openNow.get(p.storeId) }))
    .sort((a, b) => Number(Boolean(b.st?.open)) - Number(Boolean(a.st?.open)))
    .filter((x) => x.st === null || x.st === undefined || x.st.open)
    .slice(0, limit)
    .map((x) => x.p)
})

/** "Historias del barrio": fragmentos de la historia de algunos negocios (cambia cada día). */
export const neighborhoodStories = cache(async () => {
  const rows = await db.execute<{ slug: string; name: string; story: string; sector: string; logo_url: string | null }>(sql`
    select slug, name, story, sector, logo_url from stores
    where status = 'ACTIVE' and length(story) > 80
    order by md5(id::text || current_date::text) limit 3
  `)
  return rows.map((r) => ({ slug: r.slug, name: r.name, sector: r.sector, logo: r.logo_url, quote: r.story.split('\n')[0].slice(0, 220) }))
})
