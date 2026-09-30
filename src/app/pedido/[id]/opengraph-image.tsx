import { asc, eq, inArray } from 'drizzle-orm'
import { db, orderItems, orders, productImages } from '@/db'
import { asJpeg, cardImage, logoTileUri, OG_SIZE, photoUri } from '@/lib/og'
import { appUrl } from '@/lib/url'

export const alt = 'Pedido en Florece 13'
export const size = OG_SIZE
export const contentType = 'image/jpeg'

/** Vista previa del link del pedido (la que ve la tienda en WhatsApp): poca info, la foto y la marca. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const domain = new URL(appUrl()).host
  const order = /^[0-9a-f-]{36}$/i.test(id)
    ? await db.query.orders.findFirst({ where: eq(orders.id, id), with: { store: true, items: { orderBy: asc(orderItems.name) } } })
    : undefined
  if (!order) {
    return asJpeg(await cardImage({ eyebrow: 'florece 13', title: 'Pedidos de la Comuna 13', image: await logoTileUri(), domain }))
  }

  const productIds = order.items.map((i) => i.productId).filter((x): x is string => Boolean(x))
  const [photo] = productIds.length
    ? await db.select({ url: productImages.url }).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.position)).limit(1)
    : []
  const image =
    (await photoUri(photo?.url)) ??
    (await photoUri(order.store.coverUrl ?? order.store.logoUrl)) ??
    (await logoTileUri())
  const units = order.items.reduce((n, i) => n + i.quantity, 0)

  return asJpeg(
    await cardImage({
      eyebrow: '¡nuevo pedido!',
      title: order.store.name,
      subtitle: `Pedido ${order.code}`,
      chips: [`${units} ${units === 1 ? 'producto' : 'productos'}`, 'Hecho en la Comuna 13'],
      image,
      accent: '#B4127A',
      domain,
    }),
  )
}
