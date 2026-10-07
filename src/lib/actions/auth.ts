'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db, users } from '@/db'
import {
  createSession,
  destroySession,
  findUserByEmail,
  hashPassword,
  isAdminEmail,
  verifyPassword,
} from '@/lib/auth'

export type AuthState = { message?: string; errors?: Record<string, string[] | undefined>; values?: Record<string, string> } | null

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === 'string' ? next : ''
  return n.startsWith('/') && !n.startsWith('//') ? n : fallback
}

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Escribí tu nombre.').max(80),
  email: z.email('Revisá el correo.').max(160),
  password: z.string().min(8, 'Mínimo 8 caracteres.').max(128),
})

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { name: String(formData.get('name') ?? ''), email: String(formData.get('email') ?? '').trim() }
  const parsed = registerSchema.safeParse({ ...values, password: formData.get('password') ?? '' })
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values }
  const { name, email, password } = parsed.data

  if (await findUserByEmail(email)) {
    return { errors: { email: ['Ya hay una cuenta con ese correo. Entrá con tu clave.'] }, values }
  }
  // "cliente": cuenta de comprador (opcional); si no, cuenta para abrir una tienda.
  const customer = formData.get('tipo') === 'cliente'
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password), role: isAdminEmail(email) ? 'ADMIN' : customer ? 'CUSTOMER' : 'MERCHANT' })
    .returning()
  await createSession(user.id)
  // La sesión cambió: descartar las páginas que el navegador tenga guardadas.
  revalidatePath('/', 'layout')
  redirect(user.role === 'ADMIN' ? '/admin' : customer ? safeNext(formData.get('next'), '/cuenta?bienvenida=1') : '/panel/crear-tienda')
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const user = email ? await findUserByEmail(email) : undefined
  // Misma respuesta para correo inexistente y clave errada.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { message: 'El correo o la clave no coinciden.', values: { email } }
  }
  if (user.role !== 'ADMIN' && isAdminEmail(user.email)) {
    await db.update(users).set({ role: 'ADMIN' }).where(eq(users.id, user.id))
  }
  await createSession(user.id)
  // La sesión cambió: descartar las páginas que el navegador tenga guardadas.
  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next'), user.role === 'ADMIN' || isAdminEmail(user.email) ? '/admin' : user.role === 'CUSTOMER' ? '/cuenta' : '/panel'))
}

export async function logout() {
  await destroySession()
  // La sesión cambió: descartar las páginas que el navegador tenga guardadas.
  revalidatePath('/', 'layout')
  redirect('/')
}
