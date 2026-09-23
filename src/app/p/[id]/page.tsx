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
  const more = (await listProducts({ storeId: store.id, limit: 9 })).filter((p) => p.id !== product.id).slice(0, 8)
  const wa = waLink(store.whatsapp, productMessage(product.name, product.price, url))

  return (
    <div className="container">
      <nav className="small" style={{ paddingTop: 16 }} aria-label="Ruta">
        <Link href={`/t/${store.slug}`} style={{ fontWeight: 700 }}>
          <Icon name="atras" size={16} style={{ verticalAlign: '-3px' }} /> {store.name}
        </Link>
      </nav>

      <div className="product-layout">
        <Gallery images={product.images.map((i) => i.url)} alt={product.name} />

        <div className="product-info">
          {product.category && <span className="label-muted">{product.category.name}</span>}
          <h1 className="title">{product.name}</h1>
          <Price value={product.price} compareAt={product.compareAtPrice} />
          {!product.isAvailable && <div className="alert alert-info">Por ahora está agotado. Escribile a la tienda para saber cuándo vuelve.</div>}

          {product.isAvailable && (
            <div className="stack" style={{ ['--gap' as string]: '10px' }}>
              <AddToCart productId={product.id} storeId={store.id} />
              <a className="btn btn-whatsapp btn-block btn-lg" href={wa} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={20} /> Pedir por WhatsApp
              </a>
            </div>
          )}

          <ul className="small" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, color: 'var(--texto-2)' }}>
            {store.shipsNationwide && <li className="row" style={{ ['--gap' as string]: '8px' }}><Icon name="envio" size={18} /> Envíos a todo el país, coordinados con la tienda</li>}
            {store.allowsPickup && <li className="row" style={{ ['--gap' as string]: '8px' }}><Icon name="ubicacion" size={18} /> Recogida en la tienda{store.sector ? `, ${store.sector}` : ''}</li>}
            <li className="row" style={{ ['--gap' as string]: '8px' }}><Icon name="escudo" size={18} /> Pagás directo a la tienda cuando confirme tu pedido</li>
          </ul>

          {product.description && (
            <div>
              <h2 className="label" style={{ marginBottom: 8 }}>Descripción</h2>
              <p className="product-desc">{product.description}</p>
            </div>
          )}

          <Link href={`/t/${store.slug}`} className="card store-mini">
            <Avatar name={store.name} src={store.logoUrl} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{store.name}</div>
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
        <section className="section">
          <h2 className="title-sm" style={{ marginBottom: 16 }}>Más de {store.name}</h2>
          <div className="product-grid">{more.map((p) => <ProductCard key={p.id} product={p} showStore={false} />)}</div>
        </section>
      )}

      {product.isAvailable && (
        <div className="buy-bar">
          <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={20} /> WhatsApp
          </a>
          <AddToCart productId={product.id} storeId={store.id} compact />
        </div>
      )}
    </div>
  )
}
