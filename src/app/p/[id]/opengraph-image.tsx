import { productArt } from '@/lib/art'
import { formatPrice } from '@/lib/format'
import { artUri, asJpeg, cardImage, OG_SIZE, photoUri } from '@/lib/og'
import { getProduct } from '@/lib/queries'
import { appUrl } from '@/lib/url'

export const alt = 'Producto de la Comuna 13 en Florece 13'
export const size = OG_SIZE
export const contentType = 'image/jpeg'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  const domain = new URL(appUrl()).host
  if (!product || product.store.status !== 'ACTIVE') {
    return asJpeg(await cardImage({ eyebrow: 'florece 13', title: 'Hecho en la Comuna 13', image: await artUri(productArt('florece', 'artesanias')), domain }))
  }
  const image = (await photoUri(product.images[0]?.url)) ?? await artUri(productArt(product.id, product.category?.slug))
  return asJpeg(
    await cardImage({
    eyebrow: product.store.name,
    title: product.name,
    price: formatPrice(product.price),
    chips: [product.isAvailable ? 'Disponible' : 'Agotado', product.store.shipsNationwide ? 'Envíos a todo el país' : 'Recogida en la tienda'],
    image,
    domain,
    }),
  )
}
