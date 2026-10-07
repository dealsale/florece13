'use server'

import { createHash, randomBytes } from 'node:crypto'
import { and, count, desc, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { db, talentProfiles } from '@/db'
import { getCurrentUser, getStoreForUser } from '@/lib/auth'
import { normalizePhone } from '@/lib/format'

/* "Busco trabajo": perfiles sin cuenta. Quien publica guarda una clave en su celular para poder borrarlo. */

const hash = (t: string) => createHash('sha256').update(t).digest('hex')

const schema = z.object({
  name: z.string().trim().min(2, 'Escribí tu nombre.').max(60),
  trade: z.string().trim().min(2, '¿En qué trabajás o qué sabés hacer?').max(60),
  about: z.string().trim().max(500),
  sector: z.string().trim().max(60),
  availability: z.string().trim().max(60),
  whatsapp: z
    .string()
    .transform(normalizePhone)
    .refine((v) => /^573\d{9}$/.test(v) || (/^\d{11,15}$/.test(v) && !v.startsWith('57')), 'Escribí un celular válido.'),
})

export type TalentState = { ok?: boolean; id?: string; token?: string; message?: string; errors?: Record<string, string[] | undefined> } | null

export async function createTalent(_prev: TalentState, fd: FormData): Promise<TalentState> {
  if (fd.get('website')) return { message: 'No pudimos publicarlo.' }
  const parsed = schema.safeParse(Object.fromEntries(['name', 'trade', 'about', 'sector', 'availability', 'whatsapp'].map((k) => [k, String(fd.get(k) ?? '')])))
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Revisá los campos marcados.' }
  const [{ n }] = await db
    .select({ n: count() })
    .from(talentProfiles)
    .where(and(eq(talentProfiles.whatsapp, parsed.data.whatsapp), gt(talentProfiles.expiresAt, new Date())))
  if (n >= 3) return { message: 'Ya tenés perfiles publicados con ese número. Borrá uno para publicar otro.' }
  const token = randomBytes(24).toString('hex')
  const [row] = await db
    .insert(talentProfiles)
    .values({ ...parsed.data, editTokenHash: hash(token), expiresAt: new Date(Date.now() + 60 * 86400_000) })
    .returning({ id: talentProfiles.id })
  return { ok: true, id: row.id, token, message: 'Tu perfil quedó publicado por 60 días.' }
}

export async function deleteTalent(id: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{48}$/.test(token)) return { ok: false }
  await db.delete(talentProfiles).where(and(eq(talentProfiles.id, id), eq(talentProfiles.editTokenHash, hash(token))))
  return { ok: true }
}

/** Solo negocios registrados (y el admin) ven los perfiles. */
export async function listTalentForBusiness() {
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role !== 'ADMIN' && !(await getStoreForUser(user.id))) return null
  return db.select().from(talentProfiles).where(gt(talentProfiles.expiresAt, new Date())).orderBy(desc(talentProfiles.createdAt)).limit(200)
}
