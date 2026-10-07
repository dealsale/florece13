import 'server-only'
import { sql } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '@/db'

/*
 * "Tu compra floreció aquí": impacto real, calculado de los pedidos de Florece 13 (no cancelados).
 * Lo que se acuerda por fuera de la app (p. ej. solo por WhatsApp) no se cuenta.
 */

export type Impact = { total: number; orders: number; stores: number; sectors: number; entrepreneurs: number }

const toImpact = (r: Record<string, unknown> | undefined): Impact => ({
  total: Number(r?.total ?? 0),
  orders: Number(r?.orders ?? 0),
  stores: Number(r?.stores ?? 0),
  sectors: Number(r?.sectors ?? 0),
  entrepreneurs: Number(r?.entrepreneurs ?? 0),
})

/** Este mes en toda la plataforma. */
export const monthImpact = cache(async () => {
  const [r] = await db.execute(sql`
    select coalesce(sum(o.total), 0)::bigint as total, count(*)::int as orders,
      count(distinct o.store_id)::int as stores, count(distinct nullif(s.sector, ''))::int as sectors,
      count(distinct case when s.created_at > now() - interval '1 year' then s.id end)::int as entrepreneurs
    from orders o join stores s on s.id = o.store_id
    where o.status <> 'CANCELADO' and o.created_at >= date_trunc('month', now() at time zone 'America/Bogota') at time zone 'America/Bogota'
  `)
  return toImpact(r)
})

/** De un conjunto de pedidos (los de una cuenta o los guardados en un celular). Solo este mes si `month`. */
export async function ordersImpact(orderIds: string[], month = true): Promise<Impact> {
  const ids = orderIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 500)
  if (ids.length === 0) return toImpact(undefined)
  const [r] = await db.execute(sql`
    select coalesce(sum(o.total), 0)::bigint as total, count(*)::int as orders,
      count(distinct o.store_id)::int as stores, count(distinct nullif(s.sector, ''))::int as sectors,
      count(distinct case when s.created_at > now() - interval '1 year' then s.id end)::int as entrepreneurs
    from orders o join stores s on s.id = o.store_id
    where o.status <> 'CANCELADO' and o.id in ${sql.raw(`(${ids.map((id) => `'${id}'`).join(',')})`)}
      ${month ? sql`and o.created_at >= date_trunc('month', now() at time zone 'America/Bogota') at time zone 'America/Bogota'` : sql``}
  `)
  return toImpact(r)
}

/** Desde el comienzo de Florece 13. */
export const allTimeImpact = cache(async () => {
  const [r] = await db.execute(sql`
    select coalesce(sum(o.total), 0)::bigint as total, count(*)::int as orders,
      count(distinct o.store_id)::int as stores, count(distinct nullif(s.sector, ''))::int as sectors, 0 as entrepreneurs
    from orders o join stores s on s.id = o.store_id
    where o.status <> 'CANCELADO'
  `)
  return toImpact(r)
})
