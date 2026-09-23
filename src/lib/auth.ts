import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { and, eq, gt, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db, sessions, stores, users, type Store, type User } from '@/db'

const COOKIE = 'f13_sesion'
const SESSION_DAYS = 30

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1)
  return user
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt })
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)))
  jar.delete(COOKIE)
}

/** Usuario de la sesión actual (una sola consulta por request). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1)
  return row?.user ?? null
})

export async function requireUser(next = '/panel') {
  const user = await getCurrentUser()
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireAdmin() {
  const user = await requireUser('/admin')
  if (user.role !== 'ADMIN') redirect('/')
  return user
}

export const getStoreForUser = cache(async (userId: string): Promise<Store | null> => {
  const [store] = await db.select().from(stores).where(eq(stores.ownerId, userId)).limit(1)
  return store ?? null
})

/** Comerciante con tienda creada; si aún no la tiene, lo manda a crearla. */
export async function requireMerchant(next = '/panel') {
  const user = await requireUser(next)
  const store = await getStoreForUser(user.id)
  if (!store) redirect('/panel/crear-tienda')
  return { user, store }
}
