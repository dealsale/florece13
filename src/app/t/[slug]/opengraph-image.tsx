import { storeCover } from '@/lib/art'
import { artUri, cardImage, OG_SIZE, photoUri } from '@/lib/og'
import { getStoreBySlug } from '@/lib/queries'
import { appUrl } from '@/lib/url'

export const alt = 'Tienda de la Comuna 13 en Florece 13'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  const domain = new URL(appUrl()).host
  if (!store || store.status !== 'ACTIVE') {
    return cardImage({ eyebrow: 'florece 13', title: 'Tiendas de la Comuna 13', image: await artUri(storeCover('florece')), domain })
  }
  const image = (await photoUri(store.coverUrl ?? store.logoUrl)) ?? await artUri(storeCover(store.id, store.category?.slug))
  return cardImage({
    eyebrow: 'tienda de la 13',
    title: store.name,
    subtitle: store.tagline || undefined,
    chips: [store.category?.name, store.sector ? `${store.sector}, Comuna 13` : 'Comuna 13, Medellín'].filter(Boolean) as string[],
    image,
    accent: '#B4127A',
    domain,
  })
}
