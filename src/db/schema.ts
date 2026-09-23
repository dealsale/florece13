import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['MERCHANT', 'ADMIN'])
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
    /** Pesos colombianos, sin decimales. */
    price: integer('price').notNull(),
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

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Código corto que ven el comprador y el comerciante, p. ej. F13-7K2M9Q. */
    code: text('code').notNull().unique(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
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
    /** Copia del nombre y precio al momento del pedido. */
    name: text('name').notNull(),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
)

export const usersRelations = relations(users, ({ one }) => ({
  store: one(stores, { fields: [users.id], references: [stores.ownerId] }),
}))

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  category: one(categories, { fields: [stores.categoryId], references: [categories.id] }),
  products: many(products),
  orders: many(orders),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
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
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
