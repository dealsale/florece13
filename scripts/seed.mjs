// Datos base: las categorías (productos y servicios). No crea tiendas ni productos de ejemplo.
// Se puede correr varias veces sin duplicar.
import postgres from 'postgres'

// En local lee .env; en Railway las variables ya vienen del entorno.
try {
  process.loadEnvFile()
} catch {}

// [slug, nombre, ícono, universo]. El orden es el de los formularios. En el inicio solo aparecen las que tienen publicaciones.
const CATEGORIES = [
  // Comprar
  ['ropa', 'Ropa y streetwear', 'ropa', 'comprar'],
  ['calzado', 'Calzado', 'zapato', 'comprar'],
  ['accesorios', 'Accesorios', 'accesorio', 'comprar'],
  ['bolsos', 'Bolsos y mochilas', 'bolso', 'comprar'],
  ['joyeria', 'Joyería y bisutería', 'joya', 'comprar'],
  ['artesanias', 'Artesanías', 'artesania', 'comprar'],
  ['arte', 'Arte y grafiti', 'arte', 'comprar'],
  ['souvenirs', 'Souvenirs y recuerdos', 'souvenir', 'comprar'],
  ['regalos', 'Regalos y detalles', 'regalo', 'comprar'],
  ['tecnologia', 'Tecnología y celulares', 'celular', 'comprar'],
  ['mercados', 'Mercados y tiendas de barrio', 'mercado', 'comprar'],
  ['ferreterias', 'Ferreterías', 'herramienta', 'comprar'],
  ['libros', 'Papelería y libros', 'libro', 'comprar'],
  ['decoracion', 'Decoración y hogar', 'hogar', 'comprar'],
  ['cosmeticos', 'Cosméticos y cuidado', 'belleza', 'comprar'],
  ['ninos', 'Niños y juguetes', 'juguete', 'comprar'],
  ['mascotas', 'Mascotas', 'mascota', 'comprar'],
  ['plantas', 'Plantas y jardín', 'planta', 'comprar'],
  ['emprendimientos', 'Emprendimientos', 'florece', 'comprar'],
  // Comer
  ['restaurantes', 'Restaurantes', 'comida', 'comer'],
  ['comidas-rapidas', 'Comidas rápidas', 'hamburguesa', 'comer'],
  ['comida', 'Comida casera', 'olla', 'comer'],
  ['panaderias', 'Panaderías', 'pan', 'comer'],
  ['cafe', 'Cafés', 'cafe', 'comer'],
  ['dulces', 'Repostería y postres', 'dulce', 'comer'],
  ['bebidas', 'Jugos y bebidas', 'vaso', 'comer'],
  ['bares', 'Bares', 'copa', 'comer'],
  // Servicios
  ['barberias', 'Barberías', 'tijeras', 'servicios'],
  ['belleza', 'Peluquería y belleza', 'secador', 'servicios'],
  ['unas', 'Uñas', 'unas', 'servicios'],
  ['tatuajes', 'Tatuajes y piercing', 'tatuaje', 'servicios'],
  ['fotografia', 'Fotografía y video', 'camara', 'servicios'],
  ['diseno', 'Diseño y estampado', 'diseno', 'servicios'],
  ['programacion', 'Programación y web', 'codigo', 'servicios'],
  ['tecnicos', 'Técnicos y reparaciones', 'servicio', 'servicios'],
  ['electricistas', 'Electricistas y construcción', 'rayo', 'servicios'],
  ['mecanicos', 'Mecánicos y motos', 'moto', 'servicios'],
  ['clases', 'Profesores y clases', 'taller', 'servicios'],
  ['limpieza', 'Limpieza y aseo', 'escoba', 'servicios'],
  ['dj', 'DJ y sonido', 'audifonos', 'servicios'],
  ['domicilios', 'Domicilios y mandados', 'moto', 'servicios'],
  ['eventos', 'Eventos y fiestas', 'evento', 'servicios'],
  ['servicios', 'Otros servicios', 'servicio', 'servicios'],
  // Experiencias
  ['experiencias', 'Tours', 'experiencia', 'experiencias'],
  ['grafiti', 'Grafiti y murales', 'spray', 'experiencias'],
  ['baile', 'Baile y breaking', 'baile', 'experiencias'],
  ['musica', 'Música y freestyle', 'musica', 'experiencias'],
  ['talleres', 'Talleres', 'taller', 'experiencias'],
  ['hospedajes', 'Hospedajes', 'cama', 'experiencias'],
]

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}
const sql = postgres(url, { max: 1 })
try {
  for (const [position, [slug, name, icon, universe]] of CATEGORIES.entries()) {
    await sql`
      insert into categories (slug, name, icon, position, universe) values (${slug}, ${name}, ${icon}, ${position}, ${universe})
      on conflict (slug) do update set name = excluded.name, icon = excluded.icon, position = excluded.position, universe = excluded.universe`
  }
  console.log(`Categorías listas (${CATEGORIES.length}).`)
} finally {
  await sql.end()
}
