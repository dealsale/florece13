// Tiendas de prueba para verificar la plataforma de punta a punta.
//
//   SEED_DEMO=true    crea (o completa) 3 tiendas aprobadas con usuario, clave, productos y pedidos.
//   SEED_DEMO=remove  borra todo lo de prueba (usuarios @demo.florece13.test y sus tiendas, productos y pedidos).
//
// Se corre en cada despliegue desde `npm run release` y no hace nada si SEED_DEMO no está definida.
// Es idempotente: si la cuenta ya existe no la duplica.
import bcrypt from 'bcryptjs'
import postgres from 'postgres'

// En local lee .env; en Railway las variables ya vienen del entorno.
try {
  process.loadEnvFile()
} catch {}

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
  {
    email: `comida@${DOMAIN}`,
    owner: 'Gloria Restrepo',
    slug: 'arepas-dona-gloria',
    name: 'Arepas Doña Gloria',
    tagline: 'Arepas de chócolo y rellenas, recién hechas en el fogón',
    category: 'comida',
    sector: 'Las Independencias II',
    story: 'Hace 22 años que hago arepas en esta esquina. Las de chócolo las muelo yo misma cada mañana.\n\nSi pasás por las escaleras, te huele a arepa: esa soy yo.',
    instagram: '',
    whatsapp: '573000000004',
    products: [
      ['Arepa de chócolo con quesito', 9000, null, 'Chócolo molido en casa, quesito campesino y mantequilla.'],
      ['Arepa rellena de carne y queso', 14000, null, 'Bien cargada, para el almuerzo.'],
      ['Combo 2 arepas + gaseosa', 22000, 26000, 'Dos arepas de chócolo con queso y una gaseosa personal.'],
      ['Chocolate en leche', 5000, null, 'De olla, con canela.'],
    ],
  },
  {
    email: `barberia@${DOMAIN}`,
    owner: 'Kevin Mosquera',
    slug: 'barberia-el-parce',
    name: 'Barbería El Parce',
    tagline: 'Cortes, barba y diseños con flow de la 13',
    category: 'barberias',
    sector: '20 de Julio',
    story: 'Arranqué cortándoles el pelo a los parceros del barrio en la terraza. Hoy tenemos tres sillas y la mejor música de la cuadra.',
    instagram: 'barberiaelparce',
    whatsapp: '573000000005',
    kind: 'SERVICIO',
    products: [
      ['Corte clásico', 18000, null, 'Corte a máquina y tijera, lavado incluido.'],
      ['Corte + barba', 25000, 30000, 'Corte completo, perfilado y toalla caliente.'],
      ['Diseño o rayitas', 8000, null, 'Agregalo a tu corte.'],
      ['Corte niños', 14000, null, 'Hasta los 12 años.'],
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

/*
 * Lo que se sumó después (varias categorías, opciones y servicios). Es idempotente y también completa
 * tiendas de prueba que ya existían: solo agrega lo que falta.
 */
const EXTRAS = {
  'ladera-streetwear': {
    categories: ['ropa', 'diseno', 'talleres'],
    options: {
      'Camiseta Ladera': {
        options: [
          { name: 'Color', values: ['Negro', 'Blanco', 'Verde'] },
          { name: 'Talla', values: ['S', 'M', 'L', 'XL'] },
        ],
        price: (v) => (v[1] === 'XL' ? 74900 : null),
        off: ['Verde / S'],
      },
    },
    services: [
      {
        name: 'Taller de estampado en serigrafía',
        price: 120000,
        duration: '3 horas',
        description: 'Aprendé a estampar tu propia camiseta con nosotros en el taller. Incluye la camiseta, tintas y un café.',
        categories: ['talleres', 'diseno', 'experiencias'],
        options: [{ name: 'Personas', values: ['1 persona', '2 a 4 personas'] }],
        price2: (v) => (v[0] === '2 a 4 personas' ? 380000 : null),
      },
    ],
  },
  'tejidos-dona-amparo': {
    categories: ['accesorios', 'bolsos', 'joyeria', 'artesanias'],
    productCategories: { 'Mochila tejida Independencias': ['bolsos', 'artesanias'], 'Bolso manos libres de colores': ['bolsos', 'accesorios'], 'Aretes de chaquira': ['joyeria', 'artesanias'] },
    options: {
      'Mochila tejida Independencias': { options: [{ name: 'Color', values: ['Tierra', 'Mar', 'Atardecer'] }], price: () => null, off: ['Mar'] },
    },
    services: [],
  },
  'recuerdos-del-salado': {
    categories: ['souvenirs', 'experiencias', 'fotografia'],
    options: {},
    services: [
      {
        name: 'Tour fotográfico por la 13',
        price: 60000,
        priceFrom: true,
        duration: '2 horas',
        description: 'Recorrido por los murales, las escaleras eléctricas y los miradores, con un fotógrafo del barrio. Te llevás tus fotos editadas.',
        categories: ['experiencias', 'fotografia'],
        options: [{ name: 'Grupo', values: ['1 persona', '2 a 4 personas', '5 o más'] }],
        price2: (v) => ({ '2 a 4 personas': 50000, '5 o más': 45000 })[v[0]] ?? null,
      },
      {
        name: 'Sesión de fotos en los murales',
        price: 150000,
        duration: '1 hora',
        description: 'Sesión personal o en pareja entre los grafitis de la 13. 20 fotos editadas en alta.',
        categories: ['fotografia'],
        options: [],
      },
    ],
  },
}

const combos = (opts) => opts.reduce((acc, o) => acc.flatMap((c) => o.values.map((v) => [...c, v])), [[]])

async function setVariants(productId, options, priceFn = () => null, off = []) {
  await sql`update products set options = ${sql.json(options.map((o) => ({ name: o.name, values: o.values.map((v) => ({ v })) })))} where id = ${productId}`
  for (const [position, values] of combos(options).entries())
    await sql`insert into product_variants (product_id, values, price, is_available, position)
      values (${productId}, ${sql.json(values)}, ${priceFn(values)}, ${!off.includes(values.join(' / '))}, ${position})`
}

/*
 * Mapa, horario y lo "en vivo" (Flash, eventos, vacantes, historias) para que las tiendas de prueba
 * muestren todo. Solo completa lo que falta: si una oferta o historia ya venció, crea otra.
 */
const WEEK = (open, close, sunday = [open, close]) =>
  Array.from({ length: 7 }, (_, i) => (i === 6 ? (sunday ? { closed: false, open: sunday[0], close: sunday[1] } : { closed: true, open, close }) : { closed: false, open, close }))
const LIVE = {
  'ladera-streetwear': {
    geo: [6.2592, -75.6203],
    hours: WEEK('09:00', '19:00', ['10:00', '16:00']),
    deal: { title: 'Camiseta Ladera a precio de barrio', price: 55000, originalPrice: 69900, hours: 3 },
    event: { title: 'Taller abierto de serigrafía', category: 'talleres', inDays: 2, hour: 15, price: null, place: 'Terraza de Ladera Streetwear' },
    story: ['Nueva tanda de camisetas recién estampadas', ['#17BEBB', '#1F1D1B', '#FF8A00']],
  },
  'tejidos-dona-amparo': {
    geo: [6.2553, -75.6188],
    hours: WEEK('08:00', '18:00', null),
    story: ['Tejiendo la mochila de esta semana', ['#E5379B', '#FF8A00', '#2ECC71']],
  },
  'recuerdos-del-salado': {
    geo: [6.2501, -75.6232],
    hours: WEEK('10:00', '18:00', ['10:00', '17:00']),
    event: { title: 'Freestyle en el mirador', category: 'musica', inDays: 1, hour: 19, price: null, place: 'Mirador de El Salado' },
  },
  'arepas-dona-gloria': {
    geo: [6.2546, -75.6196],
    hours: WEEK('07:00', '21:00', ['07:00', '21:00']),
    delivers: true,
    categories: ['comida', 'restaurantes'],
    deal: { title: '2 arepas + gaseosa', price: 18000, originalPrice: 26000, hours: 1 },
    story: ['Acaban de salir las arepas de chócolo', ['#FF8A00', '#F2C94C', '#9C4A2F']],
  },
  'barberia-el-parce': {
    geo: [6.2569, -75.6165],
    hours: WEEK('09:00', '20:00', null),
    categories: ['barberias'],
    deal: { title: 'Corte + barba', price: 22000, originalPrice: 30000, hours: 3 },
    job: { title: 'Se busca barbero', schedule: 'Fines de semana', pay: 'Por porcentaje + propinas', description: 'Que sepa de degradados y barba. Buen ambiente y clientela fija.' },
    story: ['Hoy hay cupos hasta las 8', ['#6B5BD2', '#1F1D1B', '#17BEBB']],
  },
}

async function storyImage(ownerId, colors) {
  if (process.env.STORAGE_DRIVER === 's3') return null
  const { default: sharp } = await import('sharp')
  const { mkdir, writeFile } = await import('node:fs/promises')
  const path = await import('node:path')
  const { randomUUID } = await import('node:crypto')
  const [a, b, c] = colors
  const dots = Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 173) % 1080}" cy="${300 + ((i * 311) % 1400)}" r="${60 + ((i * 37) % 120)}" fill="${[a, c, '#F7F3EE'][i % 3]}" opacity="${0.5 + (i % 4) / 10}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/>${dots}</svg>`
  const dir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'))
  const key = `historia/${ownerId}/${randomUUID()}.webp`
  await mkdir(path.dirname(path.join(dir, key)), { recursive: true })
  await writeFile(path.join(dir, key), await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer())
  return `/media/${key}`
}

async function liveExtras(storeId, s, ownerId) {
  const x = LIVE[s.slug]
  if (!x) return
  const cats = Object.fromEntries((await sql`select id, slug from categories`).map((c) => [c.slug, c.id]))
  for (const slug of x.categories ?? [])
    if (cats[slug]) await sql`insert into store_categories (store_id, category_id) values (${storeId}, ${cats[slug]}) on conflict do nothing`
  await sql`insert into product_categories (product_id, category_id) select id, category_id from products where store_id = ${storeId} and category_id is not null on conflict do nothing`
  await sql`update stores set lat = ${x.geo[0]}, lng = ${x.geo[1]} where id = ${storeId} and lat is null`
  await sql`update stores set hours = ${sql.json(x.hours)} where id = ${storeId} and hours is null`
  if (x.delivers) await sql`update stores set delivers = true where id = ${storeId}`
  if (x.deal) {
    const [active] = await sql`select 1 from deals where store_id = ${storeId} and ends_at > now()`
    if (!active)
      await sql`insert into deals (store_id, title, price, original_price, ends_at) values (${storeId}, ${x.deal.title}, ${x.deal.price}, ${x.deal.originalPrice}, ${new Date(Date.now() + x.deal.hours * 3600000)})`
  }
  if (x.event) {
    const [future] = await sql`select 1 from events where store_id = ${storeId} and starts_at > now()`
    if (!future) {
      const d = new Date(Date.now() + x.event.inDays * DAY)
      // hora de Colombia (UTC−5)
      const starts = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), x.event.hour + 5, 0))
      await sql`insert into events (store_id, title, category, starts_at, place, price) values (${storeId}, ${x.event.title}, ${x.event.category}, ${starts}, ${x.event.place}, ${x.event.price})`
    }
  }
  if (x.job) {
    const [open] = await sql`select 1 from jobs where store_id = ${storeId} and expires_at > now()`
    if (!open)
      await sql`insert into jobs (store_id, title, schedule, pay, description, expires_at) values (${storeId}, ${x.job.title}, ${x.job.schedule}, ${x.job.pay}, ${x.job.description}, ${new Date(Date.now() + 30 * DAY)})`
  }
  if (x.story) {
    const [live] = await sql`select 1 from stories where store_id = ${storeId} and expires_at > now()`
    if (!live) {
      const url = await storyImage(ownerId, x.story[1])
      if (url) await sql`insert into stories (store_id, media_url, media_type, caption, expires_at) values (${storeId}, ${url}, 'image', ${x.story[0]}, ${new Date(Date.now() + DAY)})`
    }
  }
}

async function extras(storeId, s, cats) {
  const x = EXTRAS[s.slug]
  if (!x) return
  for (const slug of x.categories)
    if (cats[slug]) await sql`insert into store_categories (store_id, category_id) values (${storeId}, ${cats[slug]}) on conflict do nothing`
  await sql`insert into product_categories (product_id, category_id) select id, category_id from products where store_id = ${storeId} and category_id is not null on conflict do nothing`
  for (const [name, slugs] of Object.entries(x.productCategories ?? {}))
    for (const slug of slugs)
      if (cats[slug]) await sql`insert into product_categories (product_id, category_id) select id, ${cats[slug]} from products where store_id = ${storeId} and name = ${name} on conflict do nothing`
  for (const [name, o] of Object.entries(x.options)) {
    const [p] = await sql`select id, options from products where store_id = ${storeId} and name = ${name}`
    if (p && p.options.length === 0) await setVariants(p.id, o.options, o.price, o.off)
  }
  for (const sv of x.services) {
    const [exists] = await sql`select 1 from products where store_id = ${storeId} and name = ${sv.name}`
    if (exists) continue
    const main = cats[sv.categories[0]] ?? null
    const [p] = await sql`
      insert into products (store_id, category_id, kind, name, description, price, price_from, duration, is_available)
      values (${storeId}, ${main}, 'SERVICIO', ${sv.name}, ${sv.description}, ${sv.price}, ${sv.priceFrom ?? false}, ${sv.duration}, true)
      returning id`
    for (const slug of sv.categories)
      if (cats[slug]) await sql`insert into product_categories (product_id, category_id) values (${p.id}, ${cats[slug]}) on conflict do nothing`
    if (sv.options.length) await setVariants(p.id, sv.options, sv.price2)
  }
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
          insert into products (store_id, category_id, kind, name, description, price, compare_at_price, is_available, created_at)
          values (${store.id}, ${categoryId}, ${s.kind ?? 'PRODUCTO'}, ${name}, ${description}, ${price}, ${compare}, ${pi !== 3 || si !== 2}, ${new Date(now - (9 - si) * DAY + pi * 3600000)})
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
    await extras(store.id, s, cats)
    await liveExtras(store.id, s, user.id)
    console.log(`✔ ${s.name}  →  ${s.email}`)
  }
  console.log(`Tiendas de prueba listas. Clave de las cuentas: ${PASSWORD}`)
}

try {
  if (mode === 'remove') await remove()
  else await seed()
} finally {
  await sql.end()
}
