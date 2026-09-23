/**
 * Datos base que la app necesita para funcionar: las categorías del briefing.
 * No crea tiendas ni productos de ejemplo: todo lo que se ve en la plataforma es real.
 * Se puede correr varias veces sin duplicar.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { categories } from './schema'

export const CATEGORIES = [
  { slug: 'artesanias', name: 'Artesanías', icon: 'artesania' },
  { slug: 'ropa', name: 'Ropa y streetwear', icon: 'ropa' },
  { slug: 'comida', name: 'Comida', icon: 'comida' },
  { slug: 'arte', name: 'Arte', icon: 'arte' },
  { slug: 'souvenirs', name: 'Souvenirs', icon: 'souvenir' },
  { slug: 'servicios', name: 'Servicios', icon: 'servicio' },
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL')
  const client = postgres(url, { max: 1 })
  const db = drizzle(client)
  for (const [position, c] of CATEGORIES.entries()) {
    await db
      .insert(categories)
      .values({ ...c, position })
      .onConflictDoUpdate({ target: categories.slug, set: { name: c.name, icon: c.icon, position } })
  }
  await client.end()
  console.log(`Categorías listas (${CATEGORIES.length}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
