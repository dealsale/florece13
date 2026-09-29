import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getCategories, getHomeStats, listProducts, listStores } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const msg = (err: unknown) => {
  const e = err as { message?: string; cause?: { message?: string }; code?: string }
  return [e.code, e.cause?.message ?? e.message].filter(Boolean).join(' · ').slice(0, 300)
}

/**
 * Chequeo de salud (Railway lo usa antes de dar por bueno un despliegue).
 * Dice qué falla sin exponer datos: falta DATABASE_URL, no hay conexión o faltan tablas.
 * Con ?completo=1 además corre las mismas consultas del inicio y dice cuál falla.
 */
export async function GET(request: Request) {
  const completo = new URL(request.url).searchParams.has('completo')
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, problema: 'Falta la variable DATABASE_URL' }, { status: 503 })
  }
  try {
    await db.execute(sql`select 1`)
  } catch (err) {
    return Response.json({ ok: false, problema: 'No se pudo conectar a PostgreSQL', detalle: msg(err) }, { status: 503 })
  }
  let categorias = 0
  try {
    const rows = await db.execute<{ n: number }>(sql`select count(*)::int as n from categories`)
    categorias = Number((rows as unknown as { n: number }[])[0]?.n ?? 0)
  } catch (err) {
    return Response.json({ ok: false, problema: 'Faltan las tablas: las migraciones no se aplicaron (`npm run release`)', detalle: msg(err) }, { status: 503 })
  }
  if (categorias === 0) return Response.json({ ok: false, problema: 'La base no tiene categorías: falta correr `npm run release`' }, { status: 503 })
  if (!completo) return Response.json({ ok: true, categorias })

  const pruebas: Record<string, string> = {}
  const probar = async (nombre: string, fn: () => Promise<unknown>) => {
    try {
      const r = await fn()
      pruebas[nombre] = Array.isArray(r) ? `ok (${r.length})` : 'ok'
    } catch (err) {
      pruebas[nombre] = `ERROR: ${msg(err)}`
    }
  }
  await probar('categorias', () => getCategories())
  await probar('tiendas', () => listStores({ limit: 8 }))
  await probar('productos', () => listProducts({ limit: 9 }))
  await probar('estadisticas', () => getHomeStats())
  const ok = Object.values(pruebas).every((v) => v.startsWith('ok'))
  return Response.json(
    { ok, categorias, pruebas, entorno: { APP_URL: process.env.APP_URL ?? '(vacía)', STORAGE_DRIVER: process.env.STORAGE_DRIVER ?? '(vacía)', node: process.version } },
    { status: ok ? 200 : 500 },
  )
}
