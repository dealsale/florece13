import { sql } from 'drizzle-orm'
import { db } from '@/db'

export const dynamic = 'force-dynamic'

/**
 * Chequeo de salud (Railway lo usa antes de dar por bueno un despliegue).
 * Dice qué falla sin exponer datos: falta DATABASE_URL, no hay conexión o faltan tablas.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, problema: 'Falta la variable DATABASE_URL' }, { status: 503 })
  }
  try {
    await db.execute(sql`select 1`)
  } catch (err) {
    return Response.json(
      { ok: false, problema: 'No se pudo conectar a PostgreSQL', detalle: (err as Error).message.slice(0, 200) },
      { status: 503 },
    )
  }
  try {
    const rows = await db.execute<{ n: number }>(sql`select count(*)::int as n from categories`)
    const categorias = Number((rows as unknown as { n: number }[])[0]?.n ?? 0)
    if (categorias === 0) return Response.json({ ok: false, problema: 'La base no tiene categorías: falta correr `npm run release`' }, { status: 503 })
    return Response.json({ ok: true, categorias })
  } catch {
    return Response.json({ ok: false, problema: 'Faltan las tablas: las migraciones no se aplicaron (`npm run release`)' }, { status: 503 })
  }
}
