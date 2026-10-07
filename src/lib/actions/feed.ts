'use server'

import { z } from 'zod'
import { activeDeals } from '@/lib/live-queries'
import { ordersImpact } from '@/lib/impact'
import { listProducts } from '@/lib/queries'

const ids = z.array(z.uuid()).max(200)

/** Lo nuevo de las tiendas que sigue este celular. */
export async function followedFeed(storeIds: string[]) {
  const parsed = ids.safeParse(storeIds)
  if (!parsed.success || parsed.data.length === 0) return { products: [], deals: [] }
  const [products, deals] = await Promise.all([listProducts({ storeIds: parsed.data, limit: 8 }), activeDeals(60)])
  return { products, deals: deals.filter((d) => parsed.data.includes(d.storeId)).map((d) => ({ ...d, endsAt: d.endsAt.toISOString() })) }
}

/** Impacto de los pedidos hechos desde este celular (o la cuenta). */
export async function myImpact(orderIds: string[]) {
  const parsed = ids.safeParse(orderIds)
  if (!parsed.success) return null
  const [month, all] = await Promise.all([ordersImpact(parsed.data, true), ordersImpact(parsed.data, false)])
  return { month, all }
}
