'use server'

import { and, eq, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db, orders, stores, users } from '@/db'
import { requireUser } from '@/lib/auth'
import { normalizePhone } from '@/lib/format'
import type { FormState } from './merchant'

/* Cuenta de comprador (opcional). */

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Escribí tu nombre.').max(80),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => v === '' || (v.length >= 10 && v.length <= 15), 'Revisá tu celular.'),
  city: z.string().trim().max(80),
  address: z.string().trim().max(200),
})

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/cuenta')
  const parsed = profileSchema.safeParse(Object.fromEntries(['name', 'phone', 'city', 'address'].map((k) => [k, String(fd.get(k) ?? '')])))
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  await db.update(users).set(parsed.data).where(eq(users.id, user.id))
  revalidatePath('/cuenta')
  return { ok: true, message: 'Datos guardados. Se completan solos en tu próximo pedido.' }
}

/** Los pedidos hechos desde este celular antes de tener cuenta pasan a la cuenta. */
export async function claimOrders(orderIds: string[]) {
  const user = await requireUser('/cuenta')
  const ids = z.array(z.uuid()).max(200).safeParse(orderIds)
  if (!ids.success || ids.data.length === 0) return { claimed: 0 }
  const res = await db
    .update(orders)
    .set({ customerUserId: user.id })
    .where(and(inArray(orders.id, ids.data), isNull(orders.customerUserId)))
    .returning({ id: orders.id })
  if (res.length) revalidatePath('/cuenta')
  return { claimed: res.length }
}

/** Nombres de las tiendas que sigue este celular (para mostrarlas en la cuenta). */
export async function followedStores(storeIds: string[]) {
  const ids = z.array(z.uuid()).max(200).safeParse(storeIds)
  if (!ids.success || ids.data.length === 0) return []
  return db.select({ id: stores.id, slug: stores.slug, name: stores.name, logoUrl: stores.logoUrl, sector: stores.sector }).from(stores).where(inArray(stores.id, ids.data))
}
