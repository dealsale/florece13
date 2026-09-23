// Tiendas de prueba para verificar la plataforma de punta a punta.
//
//   SEED_DEMO=true    crea (o completa) 3 tiendas aprobadas con usuario, clave, productos y pedidos.
//   SEED_DEMO=remove  borra todo lo de prueba (usuarios @demo.florece13.test y sus tiendas, productos y pedidos).
//
// Se corre en cada despliegue desde `npm run release` y no hace nada si SEED_DEMO no está definida.
// Es idempotente: si la cuenta ya existe no la duplica.
import bcrypt from 'bcryptjs'
import postgres from 'postgres'

const mode = (process.env.SEED_DEMO ?? '').trim().toLowerCase()
if (!mode || mode === 'false' || mode === '0') process.exit(0)

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}
const PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Florece13-prueba'
const DOMAIN = 'demo.florece13.test'
const sql = postgres(url, { max: 1 })

const DAY = 86400000
const now = Date.now()

const STORES = [
  {
    email: `moda@${DOMAIN}`,
    owner: 'Camila Restrepo',
    slug: 'ladera-streetwear',
    name: 'Ladera Streetwear',
    tagline: 'Ropa urbana diseñada y estampada en la 13',
    category: 'ropa',
    sector: 'Nuevos Conquistadores',
    story: 'Empezamos estampando camisetas en la terraza de la casa. Cada diseño sale de las casas, los colores y la gente de la ladera.\n\nEstampado local, tallas para todos.',
    instagram: 'laderastreetwear',
    whatsapp: '573000000001',
    products: [
      ['Camiseta Ladera', 69900, 85000, 'Algodón peinado, estampado a mano. Tallas S a XXL.'],
      ['Buzo con capota "Escaleras"', 139900, null, 'Buzo perchado, estampado frontal y en la espalda.'],
      ['Gorra bordada la flor', 55000, null, 'Bordado frontal. Talla única ajustable.'],
      ['Camiseta niños "Florece"', 45000, null, 'Para los más pequeños. Tallas 2 a 12.'],
    ],
  },
  {
    email: `accesorios@${DOMAIN}`,
    owner: 'Amparo Gómez',
    slug: 'tejidos-dona-amparo',
    name: 'Tejidos Doña Amparo',
    tagline: 'Mochilas, bolsos y aretes tejidos a mano',
    category: 'accesorios',
    sector: 'Las Independencias I',
    story: 'Aprendí a tejer con mi mamá hace treinta años. Hoy somos cuatro vecinas tejiendo en la terraza, con vista a las escaleras eléctricas.\n\nCada pieza lleva el nombre de quien la tejió.',
    instagram: 'tejidosamparo',
    whatsapp: '573000000002',
    products: [
      ['Mochila tejida Independencias', 89900, 120000, 'Hilo de algodón, 30 × 25 cm, cargadera ajustable.'],
      ['Bolso manos libres de colores', 64900, null, 'Pequeño, liviano y firme. Para el celular y las llaves.'],
      ['Aretes de chaquira', 28000, null, 'Tejidos en chaquira checa, colores de la bandera de la 13.'],
      ['Monedero de tejido fino', 24900, null, 'Hecho con los retazos de cada mochila: ninguno es igual.'],
    ],
  },
  {
    email: `recuerdos@${DOMAIN}`,
    owner: 'Jhon Mario Úsuga',
    slug: 'recuerdos-del-salado',
    name: 'Recuerdos del Salado',
    tagline: 'Imanes, llaveros y postales hechos a mano',
    category: 'souvenirs',
    sector: 'El Salado',
    story: 'Pequeños recuerdos para llevarse un pedacito de la 13 a cualquier parte del mundo. Todo pintado a mano en el taller de la casa.',
    instagram: '',
    whatsapp: '573000000003',
    products: [
      ['Set de 4 imanes de las casitas', 28000, null, 'Casitas de colores pintadas a mano en madera.'],
      ['Llavero escalera eléctrica', 15000, null, 'En madera y acrílico, con argolla metálica.'],
      ['Postales de muros (pack x6)', 30000, 36000, 'Seis ilustraciones de muros del barrio en papel de algodón.'],
      ['Mini mural enmarcado', 95000, null, 'Pintura original 20 × 20 cm con marco en madera.'],
    ],
  },
]

const CUSTOMERS = [
  ['Laura Martínez', '573100000011', 'Bogotá', 'Cra 7 # 45-10, Chapinero'],
  ['Andrés Ospina', '573100000012', 'Cali', 'Calle 5 # 38-20, San Fernando'],
  ['Sofía Herrera', '573100000013', 'Medellín', ''],
  ['Daniel Cárdenas', '573100000014', 'Barranquilla', 'Cra 53 # 76-100'],
  ['Valentina Ríos', '573100000015', 'Pereira', 'Av. Circunvalar # 12-30'],
]
const STATUSES = ['NUEVO', 'NUEVO', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']
const A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const code = () => 'F13-' + Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join('')

async function remove() {
  const users = await sql`select id from users where email like ${'%@' + DOMAIN}`
  if (!users.length) return console.log('No hay datos de prueba para borrar.')
  // Borrar el usuario borra en cascada su tienda, productos, fotos, pedidos y sesiones.
  await sql`delete from users where email like ${'%@' + DOMAIN}`
  console.log(`Datos de prueba borrados (${users.length} cuentas).`)
}

async function seed() {
  const cats = Object.fromEntries((await sql`select id, slug from categories`).map((c) => [c.slug, c.id]))
  const hash = await bcrypt.hash(PASSWORD, 12)
  for (const [si, s] of STORES.entries()) {
    const categoryId = cats[s.category] ?? null
    let [user] = await sql`select id from users where lower(email) = ${s.email}`
    if (!user) [user] = await sql`insert into users (email, password_hash, name, role) values (${s.email}, ${hash}, ${s.owner}, 'MERCHANT') returning id`
    else await sql`update users set password_hash = ${hash} where id = ${user.id}`

    let [store] = await sql`select id from stores where owner_id = ${user.id}`
    if (!store) {
      let slug = s.slug
      const [taken] = await sql`select 1 from stores where slug = ${slug}`
      if (taken) slug = `${slug}-demo`
      ;[store] = await sql`
        insert into stores (owner_id, slug, name, tagline, story, category_id, whatsapp, instagram, sector, status, created_at)
        values (${user.id}, ${slug}, ${s.name}, ${s.tagline}, ${s.story}, ${categoryId}, ${s.whatsapp}, ${s.instagram}, ${s.sector}, 'ACTIVE', ${new Date(now - (10 - si) * DAY)})
        returning id`
    }

    const [{ n: productCount }] = await sql`select count(*)::int as n from products where store_id = ${store.id}`
    const productRows = []
    if (productCount === 0) {
      for (const [pi, [name, price, compare, description]] of s.products.entries()) {
        const [p] = await sql`
          insert into products (store_id, category_id, name, description, price, compare_at_price, is_available, created_at)
          values (${store.id}, ${categoryId}, ${name}, ${description}, ${price}, ${compare}, ${pi !== 3 || si !== 2}, ${new Date(now - (9 - si) * DAY + pi * 3600000)})
          returning id, name, price`
        productRows.push(p)
      }
    } else productRows.push(...(await sql`select id, name, price from products where store_id = ${store.id} order by created_at`))

    const [{ n: orderCount }] = await sql`select count(*)::int as n from orders where store_id = ${store.id}`
    if (orderCount === 0) {
      for (const [oi, status] of STATUSES.entries()) {
        const [name, phone, city, address] = CUSTOMERS[(oi + si) % CUSTOMERS.length]
        const pickup = !address
        const items = [productRows[oi % productRows.length], productRows[(oi + 1) % productRows.length]].map((p, k) => ({ ...p, quantity: k === 0 ? 1 + (oi % 2) : 1 }))
        const total = items.reduce((t, i) => t + i.price * i.quantity, 0)
        const [o] = await sql`
          insert into orders (code, store_id, customer_name, customer_phone, delivery_method, city, address, notes, subtotal, total, status, created_at)
          values (${code()}, ${store.id}, ${name}, ${phone}, ${pickup ? 'RECOGER' : 'ENVIO'}, ${pickup ? '' : city}, ${address}, ${oi === 0 ? 'Es para regalo, ¿lo pueden empacar?' : ''}, ${total}, ${total}, ${status}, ${new Date(now - oi * DAY * 1.5 - si * 3600000)})
          returning id`
        for (const i of items)
          await sql`insert into order_items (order_id, product_id, name, unit_price, quantity) values (${o.id}, ${i.id}, ${i.name}, ${i.price}, ${i.quantity})`
      }
    }
    console.log(`✔ ${s.name}  →  ${s.email}`)
  }
  console.log(`Tiendas de prueba listas. Clave de las 3 cuentas: ${PASSWORD}`)
}

try {
  if (mode === 'remove') await remove()
  else await seed()
} finally {
  await sql.end()
}
