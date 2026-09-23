import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { ShareButton } from '@/components/ShareButton'
import { getCurrentUser } from '@/lib/auth'
import { getStoreBySlug, listProducts } from '@/lib/queries'
import { appUrl } from '@/lib/url'
import { waLink } from '@/lib/whatsapp'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const store = await getStoreBySlug((await params).slug)
  if (!store || store.status !== 'ACTIVE') return { title: 'Tienda' }
  return {
    title: store.name,
    description: store.tagline || `Tienda de la Comuna 13 en Florece 13.`,
    openGraph: { images: store.coverUrl ? [store.coverUrl] : store.logoUrl ? [store.logoUrl] : [] },
  }
}

export default async function StorePage({ params }: { params: Params }) {
  const { slug } = await params
  const [store, user] = await Promise.all([getStoreBySlug(slug), getCurrentUser()])
  if (!store) notFound()
  const isOwner = user?.id === store.ownerId
  const canPreview = isOwner || user?.role === 'ADMIN'
  if (store.status !== 'ACTIVE' && !canPreview) notFound()

  const preview = store.status !== 'ACTIVE'
  const products = await listProducts({
    storeId: store.id,
    limit: 200,
    includeUnavailable: true,
    includeInactiveStore: preview,
  })

  return (
    <>
      {preview && (
        <div className="alert alert-info container" style={{ marginTop: 12 }}>
          {store.status === 'PENDING'
            ? 'Vista previa: tu tienda está en revisión y todavía no es visible al público.'
            : 'Esta tienda está suspendida y no es visible al público.'}
        </div>
      )}
      <div className={`store-cover ${store.coverUrl ? '' : 'pattern-steps'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {store.coverUrl && <img src={store.coverUrl} alt="" />}
      </div>
      <div className="container">
        <div className="store-head">
          <Avatar name={store.name} src={store.logoUrl} size={96} />
          <div className="store-head__text">
            <h1 className="title">{store.name}</h1>
            {store.tagline && <p className="subtitle" style={{ fontWeight: 500, fontSize: 18, marginTop: 4 }}>{store.tagline}</p>}
          </div>
        </div>

        <div className="row" style={{ marginTop: 14, ['--gap' as string]: '8px' }}>
          {store.category && <span className="chip chip-outline">{store.category.name}</span>}
          {store.sector && (
            <span className="chip chip-outline"><Icon name="ubicacion" size={14} /> {store.sector}, Comuna 13</span>
          )}
          {store.shipsNationwide && <span className="chip chip-outline"><Icon name="envio" size={14} /> Envíos a todo el país</span>}
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <a
            className="btn btn-whatsapp"
            href={waLink(store.whatsapp, `¡Hola, ${store.name}! Los encontré en Florece 13.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" size={20} /> Escribir por WhatsApp
          </a>
          {store.instagram && (
            <a className="btn btn-outline" href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer">
              <Icon name="instagram" size={20} /> @{store.instagram}
            </a>
          )}
          <ShareButton url={appUrl(`/t/${store.slug}`)} title={store.name} />
          {isOwner && <Link href="/panel/tienda" className="btn btn-ghost"><Icon name="editar" size={18} /> Editar</Link>}
        </div>

        <section className="section" aria-labelledby="catalogo">
          <h2 id="catalogo" className="title-sm" style={{ marginBottom: 16 }}>Catálogo</h2>
          {products.length > 0 ? (
            <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} showStore={false} />)}</div>
          ) : (
            <EmptyState
              icon="florece"
              title="Aquí florecerán sus productos."
              text={
                isOwner
                    ? 'Publicá el primero y compartí tu tienda.'
                    : 'Esta tienda está preparando su catálogo. Escribile por WhatsApp mientras tanto.'
              }
            >
              {isOwner && <Link href="/panel/productos/nuevo" className="btn btn-primary">Publicar producto</Link>}
            </EmptyState>
          )}
        </section>

        {store.story && (
          <section className="section" aria-labelledby="historia">
            <div className="card card-pad" style={{ borderLeft: '4px solid var(--verde-pedido)' }}>
              <h2 id="historia" className="title-sm" style={{ marginBottom: 12 }}>Nuestra historia</h2>
              <p className="store-story">{store.story}</p>
              {store.address && (
                <p className="small muted" style={{ marginTop: 14 }}>
                  <Icon name="ubicacion" size={14} style={{ verticalAlign: '-2px' }} /> {store.address}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
