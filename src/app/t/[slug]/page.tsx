import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { ShareButton } from '@/components/ShareButton'
import { Svg } from '@/components/Svg'
import { CATEGORY_COLORS, storeCover } from '@/lib/art'
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
    description: store.tagline || 'Tienda de la Comuna 13 en Florece 13.',
    openGraph: { images: store.coverUrl ? [store.coverUrl] : store.logoUrl ? [store.logoUrl] : [] },
  }
}

export default async function StorePage({ params }: { params: Params }) {
  const { slug } = await params
  const [store, user] = await Promise.all([getStoreBySlug(slug), getCurrentUser()])
  if (!store) notFound()
  const isOwner = user?.id === store.ownerId
  if (store.status !== 'ACTIVE' && !isOwner && user?.role !== 'ADMIN') notFound()
  const preview = store.status !== 'ACTIVE'
  const products = await listProducts({ storeId: store.id, limit: 200, includeUnavailable: true, includeInactiveStore: preview })
  const cat = store.category

  return (
    <>
      {preview && (
        <div className="wrap" style={{ marginTop: 12 }}>
          <div className="note note-info">
            <Icon name="ojo" size={20} />
            <span>{store.status === 'PENDING' ? 'Vista previa: tu tienda está en revisión y todavía no es visible al público.' : 'Esta tienda está suspendida y no es visible al público.'}</span>
          </div>
        </div>
      )}
      <div className="s-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {store.coverUrl ? <img src={store.coverUrl} alt="" /> : <Svg html={storeCover(store.id, cat?.slug)} />}
      </div>
      <div className="wrap">
        <div className="s-head rise">
          <Avatar name={store.name} src={store.logoUrl} size={108} categorySlug={cat?.slug} />
          <div className="stack" style={{ ['--gap' as string]: '6px' }}>
            <h1 className="h1">{store.name}</h1>
            {store.tagline && <p className="lede">{store.tagline}</p>}
          </div>
          <div className="row" style={{ ['--gap' as string]: '8px' }}>
            {cat && <span className="chip"><span className="dot" style={{ ['--c' as string]: CATEGORY_COLORS[cat.slug] }} />{cat.name}</span>}
            {store.sector && <span className="chip"><Icon name="ubicacion" size={14} /> {store.sector}, Comuna 13</span>}
            {store.shipsNationwide && <span className="chip"><Icon name="envio" size={14} /> Envíos a todo el país</span>}
          </div>
          <div className="s-actions">
            <a className="btn btn-wa" href={waLink(store.whatsapp, `¡Hola, ${store.name}! Los encontré en Florece 13.`)} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={20} /> Escribir por WhatsApp
            </a>
            {store.instagram && (
              <a className="btn btn-light" href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" size={20} /> @{store.instagram}
              </a>
            )}
            <ShareButton url={appUrl(`/t/${store.slug}`)} title={store.name} />
            {isOwner && <Link href="/panel/tienda" className="btn btn-ghost"><Icon name="editar" size={18} /> Editar</Link>}
          </div>
        </div>

        {store.story && (
          <section className="sec">
            <div className="s-story rise">
              <span className="tag">nuestra historia</span>
              <p className="q">{store.story}</p>
              {store.address && <p className="small muted"><Icon name="ubicacion" size={14} /> {store.address}</p>}
            </div>
          </section>
        )}

        <section className="sec">
          <div className="sec__head">
            <div><span className="tag">catálogo</span><h2 className="h2">Lo que hacemos</h2></div>
            <span className="muted small">{products.length} {products.length === 1 ? 'producto' : 'productos'}</span>
          </div>
          {products.length > 0 ? (
            <div className="grid-prods">{products.map((p, i) => <ProductCard key={p.id} product={p} showStore={false} i={i} />)}</div>
          ) : (
            <EmptyState title="Aquí florecerán sus productos." text={isOwner ? 'Publicá el primero y compartí tu tienda.' : 'Esta tienda está preparando su catálogo. Escribile por WhatsApp mientras tanto.'}>
              {isOwner && <Link href="/panel/productos/nuevo" className="btn btn-primary">Publicar producto</Link>}
            </EmptyState>
          )}
        </section>
      </div>
    </>
  )
}
