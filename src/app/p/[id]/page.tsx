import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { Gallery } from '@/components/Gallery'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { ProductActions, ProductBuyBar, ProductPriceAndOptions, ProductViewProvider } from '@/components/ProductView'
import { JsonLd } from '@/components/JsonLd'
import { ShareButton } from '@/components/ShareButton'
import { artSrc } from '@/lib/art'
import { getCurrentUser } from '@/lib/auth'
import { formatPrice } from '@/lib/format'
import { getProduct, listProducts } from '@/lib/queries'
import { isMobileRequest } from '@/lib/device'
import { appUrl } from '@/lib/url'

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).id)
  if (!product || product.store.status !== 'ACTIVE') return { title: 'Producto' }
  const title = `${product.name} · ${product.store.name}`
  const description = `${product.priceFrom ? 'Desde ' : ''}${formatPrice(product.price)} · ${product.description ? product.description.slice(0, 120) + (product.description.length > 120 ? '…' : '') : `Hecho en la Comuna 13 por ${product.store.name}.`}`
  return {
    title,
    description,
    alternates: { canonical: `/p/${product.id}` },
    openGraph: { type: 'website', title: `${title} · Florece 13`, description, url: `/p/${product.id}` },
    twitter: { card: 'summary_large_image', title: `${title} · Florece 13`, description },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()])
  if (!product) notFound()
  const { store } = product
  const isOwner = user?.id === store.ownerId
  if (store.status !== 'ACTIVE' && !isOwner && user?.role !== 'ADMIN') notFound()

  const url = appUrl(`/p/${product.id}`)
  const service = product.kind === 'SERVICIO'
  const cats = product.categories.map((c) => c.category).sort((a, b) => (a.id === product.categoryId ? -1 : b.id === product.categoryId ? 1 : a.position - b.position))
  const view = {
    id: product.id,
    name: product.name,
    kind: product.kind,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    priceFrom: product.priceFrom,
    isAvailable: product.isAvailable,
    storeId: store.id,
    whatsapp: store.whatsapp,
    url,
    rich: await isMobileRequest(),
    options: product.options,
    variants: product.variants.map((v) => ({ id: v.id, values: v.values, price: v.price, isAvailable: v.isAvailable })),
  }
  const more = (await listProducts({ storeId: store.id, limit: 5 })).filter((p) => p.id !== product.id).slice(0, 4)

  const abs = (u: string) => (u.startsWith('/') ? appUrl(u) : u)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': service ? 'Service' : 'Product',
    name: product.name,
    description: product.description || `Hecho en la Comuna 13 por ${store.name}.`,
    image: product.images.length ? product.images.map((i) => abs(i.url)) : [appUrl(`/p/${product.id}/opengraph-image`)],
    ...(product.category && { category: product.category.name }),
    ...(service ? { provider: { '@type': 'LocalBusiness', name: store.name } } : { brand: { '@type': 'Brand', name: store.name } }),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'COP',
      price: product.price,
      availability: product.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: store.name, url: appUrl(`/t/${store.slug}`) },
    },
  }

  return (
    <ProductViewProvider data={view}>
    <div className="wrap">
      {store.status === 'ACTIVE' && <JsonLd data={jsonLd} />}
      <div style={{ paddingTop: 16 }}>
        <Link href={`/t/${store.slug}`} className="more"><Icon name="atras" size={16} /> {store.name}</Link>
      </div>

      <div className="p-layout">
        <div className="rise">
          <Gallery images={product.images.map((i) => i.url)} alt={product.name} fallbackSrc={artSrc('producto', product.id, product.category?.slug)} />
        </div>

        <div className="p-info rise" style={{ ['--i' as string]: 1 }}>
          {cats.length > 0 && <span className="eyebrow">{cats.map((c) => c.name).join(' · ')}</span>}
          <h1 className="h1">{product.name}</h1>
          {(service || product.duration) && (
            <div className="row" style={{ ['--gap' as string]: '6px' }}>
              {service && <span className="chip chip-kind-lg"><Icon name="experiencia" size={14} /> Servicio</span>}
              {product.duration && <span className="chip"><Icon name="reloj" size={14} /> {product.duration}</span>}
            </div>
          )}
          <ProductPriceAndOptions />
          <ProductActions />

          <ul className="perks">
            {service ? (
              <>
                <li><i style={{ background: 'var(--tint-turquesa)', color: 'var(--turquesa-t)' }}><Icon name="whatsapp" size={18} /></i>Reservás por WhatsApp y acordás fecha y hora con {store.name}</li>
                <li><i style={{ background: 'var(--tint-naranja)', color: 'var(--naranja-t)' }}><Icon name="ubicacion" size={18} /></i>{store.sector ? `En ${store.sector}, Comuna 13` : 'En la Comuna 13, Medellín'}</li>
              </>
            ) : (
              <>
                {store.shipsNationwide && <li><i style={{ background: 'var(--tint-turquesa)', color: 'var(--turquesa-t)' }}><Icon name="envio" size={18} /></i>Envíos a todo el país, coordinados con la tienda</li>}
                {store.allowsPickup && <li><i style={{ background: 'var(--tint-naranja)', color: 'var(--naranja-t)' }}><Icon name="ubicacion" size={18} /></i>Recogida en la tienda{store.sector ? `, ${store.sector}` : ''}</li>}
              </>
            )}
            <li><i style={{ background: 'var(--tint-verde)', color: 'var(--verde)' }}><Icon name="escudo" size={18} /></i>{service ? 'Pagás directo a la tienda cuando confirme tu reserva' : 'Pagás directo a la tienda cuando confirme tu pedido'}</li>
          </ul>

          {product.description && (
            <div className="stack" style={{ ['--gap' as string]: '8px' }}>
              <span className="eyebrow">Descripción</span>
              <p className="desc">{product.description}</p>
            </div>
          )}

          <Link href={`/t/${store.slug}`} className="mini-store">
            <Avatar name={store.name} src={store.logoUrl} size={50} categorySlug={product.category?.slug} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{store.name}</div>
              <div className="small muted">{store.sector ? `${store.sector}, Comuna 13` : 'Comuna 13, Medellín'}</div>
            </div>
            <Icon name="flecha" />
          </Link>

          <div className="row">
            <ShareButton url={url} title={product.name} />
            {isOwner && <Link href={`/panel/productos/${product.id}`} className="btn btn-ghost"><Icon name="editar" size={18} /> Editar</Link>}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="sec">
          <div className="sec__head"><div><span className="tag">de la misma tienda</span><h2 className="h2">Más de {store.name}</h2></div></div>
          <div className="grid-prods">{more.map((p, i) => <ProductCard key={p.id} product={p} showStore={false} i={i} />)}</div>
        </section>
      )}

      <ProductBuyBar />
    </div>
    </ProductViewProvider>
  )
}
