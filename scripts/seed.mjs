// Datos base: las categorías (productos y servicios). No crea tiendas ni productos de ejemplo.
// Se puede correr varias veces sin duplicar.
import postgres from 'postgres'

// En local lee .env; en Railway las variables ya vienen del entorno.
try {
  process.loadEnvFile()
} catch {}

// [slug, nombre, ícono]. El orden es el de los formularios. En el inicio solo aparecen las que tienen publicaciones.
const CATEGORIES = [
  ['artesanias', 'Artesanías', 'artesania'],
  ['ropa', 'Ropa y streetwear', 'ropa'],
  ['accesorios', 'Accesorios', 'accesorio'],
  ['bolsos', 'Bolsos y mochilas', 'bolso'],
  ['calzado', 'Calzado', 'zapato'],
  ['joyeria', 'Joyería y bisutería', 'joya'],
  ['arte', 'Arte y grafiti', 'arte'],
  ['souvenirs', 'Souvenirs y recuerdos', 'souvenir'],
  ['decoracion', 'Decoración y hogar', 'hogar'],
  ['comida', 'Comida', 'comida'],
  ['cafe', 'Café y bebidas', 'cafe'],
  ['dulces', 'Dulces y postres', 'dulce'],
  ['belleza', 'Belleza y cuidado', 'belleza'],
  ['musica', 'Música', 'musica'],
  ['libros', 'Libros y papelería', 'libro'],
  ['ninos', 'Niños y juguetes', 'juguete'],
  ['mascotas', 'Mascotas', 'mascota'],
  ['plantas', 'Plantas y jardín', 'planta'],
  ['experiencias', 'Experiencias y tours', 'experiencia'],
  ['fotografia', 'Fotografía y video', 'camara'],
  ['talleres', 'Talleres y clases', 'taller'],
  ['eventos', 'Eventos y fiestas', 'evento'],
  ['diseno', 'Diseño y estampado', 'diseno'],
  ['servicios', 'Otros servicios', 'servicio'],
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
