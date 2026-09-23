import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL (ver .env.example)')
  // En desarrollo el hot reload re-evalúa este módulo; reusamos la conexión.
  const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> }
  const client = globalForDb.pg ?? postgres(url, { max: 10 })
  if (process.env.NODE_ENV !== 'production') globalForDb.pg = client
  return drizzle(client, { schema })
}

type Db = ReturnType<typeof createDb>
let instance: Db | undefined

/**
 * Conexión perezosa: se abre en la primera consulta, no al importar el módulo.
 * Así `next build` funciona aunque DATABASE_URL todavía no esté disponible.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= createDb()
    const value = Reflect.get(instance, prop, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export * from './schema'
