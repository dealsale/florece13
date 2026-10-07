import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { JsonLd } from '@/components/JsonLd'
import { Icon } from '@/components/Icon'
import { ProductCard } from '@/components/ProductCard'
import { ShareButton } from '@/components/ShareButton'
import { artSrc, CATEGORY_COLORS } from '@/lib/art'
import { getCurrentUser } from '@/lib/auth'
import { getStoreBySlug, listProducts } from '@/lib/queries'
import { isMobileRequest } from '@/lib/device'
import { openStatus } from '@/lib/time'
import { FollowButton } from '@/components/live/FollowButton'
import { appUrl } from '@/lib/url'
import { storeGreeting, waLink } from '@/lib/whatsapp'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const store = await getStoreBySlug((await params).slug)
  if (!store || store.status !== 'ACTIVE') return { title: 'Tienda' }
  const description = [store.tagline, store.sector && `${store.sector}, Comuna 13, Medellín.`, 'Pedí directo por WhatsApp en Florece 13.']
    .filter(Boolean)
    .join(' ')
  return {
    title: store.name,
    description,
    alternates: { canonical: `/t/${store.slug}` },
    openGraph: { type: 'website', title: `${store.name} · Florece 13`, description, url: `/t/${store.slug}` },
    twitter: { card: 'summary_large_image', title: `${store.name} · Florece 13`, description },
  }
}

export default async function StorePage({ params }: { params: Params }) {
  const { slug } = await params
  const [store, user] = await Promise.all([getStoreBySlug(slug), getCurrentUser()])
  if (!store) notFound()
  const isOwner = user?.id === store.ownerId
  if (store.status !== 'ACTIVE' && !isOwner && user?.role !== 'ADMIN') notFound()
  const rich = await isMobileRequest()
  const preview = store.status !== 'ACTIVE'
  const products = await listProducts({ storeId: store.id, limit: 200, includeUnavailable: true, includeInactiveStore: preview })
  const cat = store.category
  const cats = store.categories.map((c) => c.category).sort((a, b) => (a.id === store.categoryId ? -1 : b.id === store.categoryId ? 1 : a.position - b.position))
  const status = openStatus(store.hours)
  const goods = products.filter((p) => p.kind === 'PRODUCTO')
  const services = products.filter((p) => p.kind === 'SERVICIO')
  const sections = [
    { key: 'p', tag: 'catálogo', title: services.length ? 'Productos' : 'Lo que hacemos', items: goods, unit: ['producto', 'productos'] },
    { key: 's', tag: 'para vivir la 13', title: goods.length ? 'Servicios y experiencias' : 'Lo que ofrecemos', items: services, unit: ['servicio', 'servicios'] },
  ].filter((s) => s.items.length > 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.tagline || store.story.slice(0, 200),
    url: appUrl(`/t/${store.slug}`),
    image: appUrl(`/t/${store.slug}/opengraph-image`),
    ...(store.logoUrl && { logo: store.logoUrl.startsWith('/') ? appUrl(store.logoUrl) : store.logoUrl }),
    address: {
      '@type': 'PostalAddress',
      ...(store.address && { streetAddress: store.address }),
      addressLocality: store.sector ? `${store.sector}, Comuna 13, Medellín` : 'Comuna 13, Medellín',
      addressRegion: 'Antioquia',
      addressCountry: 'CO',
    },
    ...(store.instagram && { sameAs: [`https://instagram.com/${store.instagram}`] }),
  }

  return (
    <>
      {!preview && <JsonLd data={jsonLd} />}
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
        <img src={store.coverUrl ?? artSrc('tienda', store.id, cat?.slug)} alt="" fetchPriority="high" />
      </div>
      <div className="wrap">
        <div className="s-head rise">
          <Avatar name={store.name} src={store.logoUrl} size={108} categorySlug={cat?.slug} />
          <div className="stack" style={{ ['--gap' as string]: '6px' }}>
            <h1 className="h1">{store.name}</h1>
            {store.tagline && <p className="lede">{store.tagline}</p>}
          </div>
          <div className="row" style={{ ['--gap' as string]: '8px' }}>
            {cats.map((c) => (
              <Link key={c.id} href={`/tiendas?cat=${c.slug}`} className="chip"><span className="dot" style={{ ['--c' as string]: CATEGORY_COLORS[c.slug] }} />{c.name}</Link>
            ))}
            {status && <span className={`chip ${status.open ? 'chip-open' : 'chip-closed'}`}><i className="dotlive" />{status.label}</span>}
            {store.delivers && <span className="chip"><Icon name="moto" size={14} /> Domicilio</span>}
            {store.sector && <span className="chip"><Icon name="ubicacion" size={14} /> {store.sector}, Comuna 13</span>}
            {store.shipsNationwide && <span className="chip"><Icon name="envio" size={14} /> Envíos a todo el país</span>}
          </div>
          <div className="s-actions">
            {!preview && <FollowButton storeId={store.id} storeName={store.name} />}
            <a className="btn btn-wa" href={waLink(store.whatsapp, storeGreeting(store.name, appUrl(`/t/${store.slug}`), rich))} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={20} /> Escribir por WhatsApp
            </a>
            {store.instagram && (
              <a className="btn btn-light" href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" size={20} /> @{store.instagram}
              </a>
            )}
            {store.lat != null && store.lng != null && (
              <a className="btn btn-light" href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`} target="_blank" rel="noopener noreferrer">
                <Icon name="navegar" size={18} /> Cómo llegar
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

        {sections.map((sec) => (
          <section key={sec.key} className="sec">
            <div className="sec__head">
              <div><span className="tag">{sec.tag}</span><h2 className="h2">{sec.title}</h2></div>
              <span className="muted small">{sec.items.length} {sec.items.length === 1 ? sec.unit[0] : sec.unit[1]}</span>
            </div>
            <div className="grid-prods">{sec.items.map((p, i) => <ProductCard key={p.id} product={p} showStore={false} i={i} />)}</div>
          </section>
        ))}
        {products.length === 0 && (
          <section className="sec">
            <EmptyState title="Aquí florecerá su catálogo." text={isOwner ? 'Publicá tu primer producto o servicio y compartí tu tienda.' : 'Esta tienda está preparando su catálogo. Escribile por WhatsApp mientras tanto.'}>
              {isOwner && <Link href="/panel/productos/nuevo" className="btn btn-primary">Publicar</Link>}
            </EmptyState>
          </section>
        )}
      </div>
    </>
  )
}
