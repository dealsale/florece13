// Datos base: las categorías del briefing. No crea tiendas ni productos de ejemplo.
// Se puede correr varias veces sin duplicar.
import postgres from 'postgres'

const CATEGORIES = [
  ['artesanias', 'Artesanías', 'artesania'],
  ['ropa', 'Ropa y streetwear', 'ropa'],
  ['comida', 'Comida', 'comida'],
  ['arte', 'Arte', 'arte'],
  ['souvenirs', 'Souvenirs', 'souvenir'],
  ['accesorios', 'Accesorios', 'accesorio'],
  ['servicios', 'Servicios', 'servicio'],
]

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}
const sql = postgres(url, { max: 1 })
try {
  for (const [position, [slug, name, icon]] of CATEGORIES.entries()) {
    await sql`
      insert into categories (slug, name, icon, position) values (${slug}, ${name}, ${icon}, ${position})
      on conflict (slug) do update set name = excluded.name, icon = excluded.icon, position = excluded.position`
  }
  console.log(`Categorías listas (${CATEGORIES.length}).`)
} finally {
  await sql.end()
}
