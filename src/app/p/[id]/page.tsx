import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/AddToCart'
import { Avatar } from '@/components/Avatar'
import { Gallery } from '@/components/Gallery'
import { Icon } from '@/components/Icon'
import { Price } from '@/components/Price'
import { ProductCard } from '@/components/ProductCard'
import { ShareButton } from '@/components/ShareButton'
import { productArt } from '@/lib/art'
import { getCurrentUser } from '@/lib/auth'
import { getProduct, listProducts } from '@/lib/queries'
import { appUrl } from '@/lib/url'
import { productMessage, waLink } from '@/lib/whatsapp'

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).id)
  if (!product || product.store.status !== 'ACTIVE') return { title: 'Producto' }
  return {
    title: `${product.name} · ${product.store.name}`,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
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
  const wa = waLink(store.whatsapp, productMessage(product.name, product.price, url))
  const more = (await listProducts({ storeId: store.id, limit: 5 })).filter((p) => p.id !== product.id).slice(0, 4)

  return (
    <div className="wrap">
      <div style={{ paddingTop: 16 }}>
        <Link href={`/t/${store.slug}`} className="more"><Icon name="atras" size={16} /> {store.name}</Link>
      </div>

      <div className="p-layout">
        <div className="rise">
          <Gallery images={product.images.map((i) => i.url)} alt={product.name} fallbackSvg={productArt(product.id, product.category?.slug)} />
        </div>

        <div className="p-info rise" style={{ ['--i' as string]: 1 }}>
          {product.category && <span className="eyebrow">{product.category.name}</span>}
          <h1 className="h1">{product.name}</h1>
          <Price value={product.price} compareAt={product.compareAtPrice} />
          {product.isAvailable ? (
            <div className="stack" style={{ ['--gap' as string]: '10px' }}>
              <AddToCart productId={product.id} storeId={store.id} name={product.name} />
              <a className="btn btn-wa btn-lg btn-block" href={wa} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={20} /> Pedir por WhatsApp
              </a>
            </div>
          ) : (
            <div className="note note-info">Por ahora está agotado. Escribile a la tienda para saber cuándo vuelve.</div>
          )}

          <ul className="perks">
            {store.shipsNationwide && <li><i style={{ background: 'var(--tint-turquesa)', color: 'var(--turquesa-t)' }}><Icon name="envio" size={18} /></i>Envíos a todo el país, coordinados con la tienda</li>}
            {store.allowsPickup && <li><i style={{ background: 'var(--tint-naranja)', color: 'var(--naranja-t)' }}><Icon name="ubicacion" size={18} /></i>Recogida en la tienda{store.sector ? `, ${store.sector}` : ''}</li>}
            <li><i style={{ background: 'var(--tint-verde)', color: 'var(--verde)' }}><Icon name="escudo" size={18} /></i>Pagás directo a la tienda cuando confirme tu pedido</li>
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
            {isOwner && <Link href={`/panel/productos/${product.id}`} className="btn btn-ghost"><Icon name="editar" size={18} /> Editar producto</Link>}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="sec">
          <div className="sec__head"><div><span className="tag">de la misma tienda</span><h2 className="h2">Más de {store.name}</h2></div></div>
          <div className="grid-prods">{more.map((p, i) => <ProductCard key={p.id} product={p} showStore={false} i={i} />)}</div>
        </section>
      )}

      {product.isAvailable && (
        <div className="buybar">
          <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={20} /> WhatsApp</a>
          <AddToCart productId={product.id} storeId={store.id} name={product.name} compact />
        </div>
      )}
    </div>
  )
}
