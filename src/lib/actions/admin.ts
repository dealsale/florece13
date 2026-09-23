'use server'

import { randomInt } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db, sessions, stores, users } from '@/db'
import { hashPassword, requireAdmin } from '@/lib/auth'

export async function setStoreStatus(storeId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') {
  await requireAdmin()
  await db.update(stores).set({ status }).where(eq(stores.id, storeId))
  revalidatePath('/', 'layout')
}

export type ResetState = { password?: string } | null

/** Genera una clave temporal para el dueño de la tienda y cierra sus sesiones abiertas. */
export async function resetOwnerPassword(storeId: string, _prev: ResetState): Promise<ResetState> {
  await requireAdmin()
  const [store] = await db.select({ ownerId: stores.ownerId }).from(stores).where(eq(stores.id, storeId)).limit(1)
  if (!store) return null
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  const password = Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join('')
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, store.ownerId))
  await db.delete(sessions).where(eq(sessions.userId, store.ownerId))
  return { password }
}
