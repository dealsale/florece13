import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  primaryKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/** CUSTOMER: comprador con cuenta (opcional; comprar no exige cuenta). */
export const userRole = pgEnum('user_role', ['MERCHANT', 'ADMIN', 'CUSTOMER'])
export const storeStatus = pgEnum('store_status', ['PENDING', 'ACTIVE', 'SUSPENDED'])
/** Ruta de pedido que elige el comerciante. CHECKOUT queda listo para cuando se conecte la pasarela. */
export const orderMode = pgEnum('order_mode', ['WHATSAPP', 'CHECKOUT'])
export const orderStatus = pgEnum('order_status', [
  'NUEVO',
  'CONFIRMADO',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
])
export const orderChannel = pgEnum('order_channel', ['WHATSAPP', 'CHECKOUT'])
export const paymentStatus = pgEnum('payment_status', ['PENDIENTE', 'PAGADO', 'FALLIDO', 'REEMBOLSADO'])
export const deliveryMethod = pgEnum('delivery_method', ['ENVIO', 'RECOGER'])
/** Lo que se publica: un producto (va al carrito) o un servicio/experiencia (se reserva por WhatsApp). */
export const productKind = pgEnum('product_kind', ['PRODUCTO', 'SERVICIO'])

/**
 * Opciones de un producto (máx. 2 grupos), p. ej. [{ name: 'Color', values: [{ v: 'Negro', img: '/media/…' }] }, { name: 'Talla', values: [{ v: 'M' }] }].
 * `img` es una de las fotos del producto: al elegir ese valor, la galería muestra esa foto.
 */
/** 7 días (0 = lunes). Cada día: cerrado o de `open` a `close` ("08:00"–"20:00"; si close < open, cierra pasada la medianoche). */
export type StoreHours = { closed: boolean; open: string; close: string }[]

export type ProductOption = { name: string; values: { v: string; img?: string | null }[] }

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: userRole('role').notNull().default('MERCHANT'),
    /** Datos del comprador para autocompletar el pedido. */
    phone: text('phone').notNull().default(''),
    city: text('city').notNull().default(''),
    address: text('address').notNull().default(''),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_idx').on(sql`lower(${t.email})`)],
)

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 del token de la cookie; el token en claro nunca se guarda. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  /** Nombre del ícono de la UI (ver components/Icon). */
  icon: text('icon').notNull(),
  /** Universo al que pertenece: comprar, comer, servicios, experiencias (ver lib/universes). */
  universe: text('universe').notNull().default('comprar'),
  position: integer('position').notNull().default(0),
})

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    tagline: text('tagline').notNull().default(''),
    /** La historia del negocio: quién lo hace, desde cuándo, qué lo hace de la 13. */
    story: text('story').notNull().default(''),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    /** Número en formato internacional sin "+", p. ej. 573001234567. */
    whatsapp: text('whatsapp').notNull(),
    instagram: text('instagram').notNull().default(''),
    /** Sector dentro de la Comuna 13 (Las Independencias, El Salado, 20 de Julio…). */
    sector: text('sector').notNull().default(''),
    address: text('address').notNull().default(''),
    logoUrl: text('logo_url'),
    coverUrl: text('cover_url'),
    /** Ubicación en el mapa (la marca el comerciante). */
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    /** Horario semanal, lunes a domingo; null = no lo publicó. */
    hours: jsonb('hours').$type<StoreHours>(),
    /** Hace domicilios en el barrio. */
    delivers: boolean('delivers').notNull().default(false),
    shipsNationwide: boolean('ships_nationwide').notNull().default(true),
    allowsPickup: boolean('allows_pickup').notNull().default(true),
    orderMode: orderMode('order_mode').notNull().default('WHATSAPP'),
    status: storeStatus('status').notNull().default('PENDING'),
    ...timestamps,
  },
  (t) => [index('stores_status_idx').on(t.status), index('stores_category_idx').on(t.categoryId)],
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    kind: productKind('kind').notNull().default('PRODUCTO'),
    /** Pesos colombianos, sin decimales. Con variantes es el precio base (cada variante puede tener el suyo). */
    price: integer('price').notNull(),
    /** Se muestra "Desde $…" (servicios con precio según grupo, duración, etc.). */
    priceFrom: boolean('price_from').notNull().default(false),
    /** Servicios: "2 horas", "Sesión de 1 hora"… */
    duration: text('duration').notNull().default(''),
    options: jsonb('options').$type<ProductOption[]>().notNull().default([]),
    compareAtPrice: integer('compare_at_price'),
    isAvailable: boolean('is_available').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index('products_store_idx').on(t.storeId),
    index('products_category_idx').on(t.categoryId),
    index('products_created_idx').on(t.createdAt),
  ],
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('product_images_product_idx').on(t.productId)],
)

/** Combinaciones de opciones (Negro / M). Sin precio propio usan el del producto. */
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    /** Un valor por cada grupo de opciones, en el mismo orden que products.options. */
    values: jsonb('values').$type<string[]>().notNull(),
    price: integer('price'),
    isAvailable: boolean('is_available').notNull().default(true),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('product_variants_product_idx').on(t.productId)],
)

/** Categorías de cada producto (puede tener varias; products.category_id es la principal). */
export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] }), index('product_categories_category_idx').on(t.categoryId)],
)

/** Categorías de cada tienda (puede tener varias; stores.category_id es la principal). */
export const storeCategories = pgTable(
  'store_categories',
  {
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.storeId, t.categoryId] }), index('store_categories_category_idx').on(t.categoryId)],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Código corto que ven el comprador y el comerciante, p. ej. F13-7K2M9Q. */
    code: text('code').notNull().unique(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    /** Si el comprador tenía cuenta al pedir (opcional). */
    customerUserId: uuid('customer_user_id').references(() => users.id, { onDelete: 'set null' }),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email').notNull().default(''),
    deliveryMethod: deliveryMethod('delivery_method').notNull(),
    city: text('city').notNull().default(''),
    address: text('address').notNull().default(''),
    notes: text('notes').notNull().default(''),
    subtotal: integer('subtotal').notNull(),
    total: integer('total').notNull(),
    channel: orderChannel('channel').notNull().default('WHATSAPP'),
    status: orderStatus('status').notNull().default('NUEVO'),
    paymentStatus: paymentStatus('payment_status').notNull().default('PENDIENTE'),
    /** Referencia de la pasarela cuando se active el checkout con pago. */
    paymentReference: text('payment_reference'),
    ...timestamps,
  },
  (t) => [index('orders_store_idx').on(t.storeId, t.createdAt)],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    /** Copia del nombre (con la opción elegida, p. ej. "Camiseta Ladera · Negro / M") y del precio al momento del pedido. */
    name: text('name').notNull(),
    variantLabel: text('variant_label').notNull().default(''),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
)

/** Florece Flash: ofertas que duran poco (1 hora, 3 horas, hoy). */
export const deals = pgTable(
  'deals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    imageUrl: text('image_url'),
    price: integer('price').notNull(),
    originalPrice: integer('original_price'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('deals_ends_idx').on(t.endsAt), index('deals_store_idx').on(t.storeId)],
)

/** Eventos: freestyle, talleres abiertos, conciertos, ferias… */
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    imageUrl: text('image_url'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    /** Dónde (si no, la dirección de la tienda). */
    place: text('place').notNull().default(''),
    /** null = entrada libre. */
    price: integer('price'),
    /** musica | arte | deportes | baile | talleres | gastronomia | ferias | otros (ver lib/agenda). */
    category: text('category').notNull().default('otros'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('events_starts_idx').on(t.startsAt), index('events_store_idx').on(t.storeId)],
)

/** Empleo: lo que los negocios de la 13 están buscando. */
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    /** Tiempo completo, medio tiempo, por días, por proyecto. */
    schedule: text('schedule').notNull().default(''),
    pay: text('pay').notNull().default(''),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('jobs_expires_idx').on(t.expiresAt), index('jobs_store_idx').on(t.storeId)],
)

/**
 * "Busco trabajo": perfiles de gente del barrio. Se publican sin cuenta (el navegador guarda la clave
 * para editarlos) y solo los ven los negocios registrados.
 */
export const talentProfiles = pgTable(
  'talent_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    trade: text('trade').notNull(),
    about: text('about').notNull().default(''),
    sector: text('sector').notNull().default(''),
    availability: text('availability').notNull().default(''),
    whatsapp: text('whatsapp').notNull(),
    /** SHA-256 de la clave de edición que queda en el celular de quien publicó. */
    editTokenHash: text('edit_token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('talent_expires_idx').on(t.expiresAt)],
)

/** Historias: foto o video corto que el negocio publica y se ve durante 24 horas. */
export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    mediaUrl: text('media_url').notNull(),
    /** image | video */
    mediaType: text('media_type').notNull().default('image'),
    caption: text('caption').notNull().default(''),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('stories_expires_idx').on(t.expiresAt), index('stories_store_idx').on(t.storeId)],
)

/**
 * Dispositivos de compradores (sin cuenta): el id lo genera el navegador y lo guarda.
 * Sirve para seguir negocios y para "Avisarme de ofertas cerca" (push + ubicación aproximada).
 */
export const devices = pgTable(
  'devices',
  {
    id: uuid('id').primaryKey(),
    endpoint: text('endpoint'),
    p256dh: text('p256dh'),
    auth: text('auth'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    /** Avisar de ofertas Flash dentro de este radio. */
    nearDeals: boolean('near_deals').notNull().default(false),
    radiusM: integer('radius_m').notNull().default(1500),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('devices_endpoint_idx').on(t.endpoint)],
)

/** Negocios que sigue cada dispositivo. */
export const follows = pgTable(
  'follows',
  {
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.deviceId, t.storeId] }), index('follows_store_idx').on(t.storeId)],
)

export const usersRelations = relations(users, ({ one }) => ({
  store: one(stores, { fields: [users.id], references: [stores.ownerId] }),
}))

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  category: one(categories, { fields: [stores.categoryId], references: [categories.id] }),
  categories: many(storeCategories),
  products: many(products),
  orders: many(orders),
  deals: many(deals),
  events: many(events),
  jobs: many(jobs),
  stories: many(stories),
}))

export const dealsRelations = relations(deals, ({ one }) => ({
  store: one(stores, { fields: [deals.storeId], references: [stores.id] }),
  product: one(products, { fields: [deals.productId], references: [products.id] }),
}))
export const eventsRelations = relations(events, ({ one }) => ({
  store: one(stores, { fields: [events.storeId], references: [stores.id] }),
}))
export const jobsRelations = relations(jobs, ({ one }) => ({
  store: one(stores, { fields: [jobs.storeId], references: [stores.id] }),
}))
export const storiesRelations = relations(stories, ({ one }) => ({
  store: one(stores, { fields: [stories.storeId], references: [stores.id] }),
}))

/** Suscripciones de notificaciones push: una por navegador/celular donde el usuario las activó. */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('push_subscriptions_endpoint_idx').on(t.endpoint), index('push_subscriptions_user_idx').on(t.userId)],
)

/** Bandeja de avisos del panel (lo mismo que llega por push queda guardado aquí). */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    url: text('url').notNull().default('/panel'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
)

/** Ajustes internos de la app (p. ej. las claves VAPID de las notificaciones push). */
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  categories: many(productCategories),
}))

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}))

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, { fields: [productCategories.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategories.categoryId], references: [categories.id] }),
}))

export const storeCategoriesRelations = relations(storeCategories, ({ one }) => ({
  store: one(stores, { fields: [storeCategories.storeId], references: [stores.id] }),
  category: one(categories, { fields: [storeCategories.categoryId], references: [categories.id] }),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}))

export type User = typeof users.$inferSelect
export type Store = typeof stores.$inferSelect
export type Category = typeof categories.$inferSelect
export type Product = typeof products.$inferSelect
export type ProductImage = typeof productImages.$inferSelect
export type ProductVariant = typeof productVariants.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type Deal = typeof deals.$inferSelect
export type Event = typeof events.$inferSelect
export type Job = typeof jobs.$inferSelect
export type Story = typeof stories.$inferSelect
