'use client'

import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { Svg } from '@/components/Svg'
import { productArt } from '@/lib/art'
import { formatPrice } from '@/lib/format'
import { useCartProducts, type CartLine } from './useCartProducts'

export function CartView() {
  const { cart, lines } = useCartProducts()

  if (!cart.ready || lines === null) return <div className="shimmer" style={{ height: 260, borderRadius: 24 }} />

  if (lines.length === 0) {
    return (
      <EmptyState title="Tu carrito está vacío." text="Explorá lo que se hace en la 13 y agregá lo que te guste.">
        <Link href="/buscar" className="btn btn-primary">Explorar productos</Link>
      </EmptyState>
    )
  }

  const groups = new Map<string, CartLine[]>()
  for (const l of lines) groups.set(l.storeId, [...(groups.get(l.storeId) ?? []), l])

  return (
    <div className="stack" style={{ ['--gap' as string]: '18px' }}>
      {groups.size > 1 && (
        <div className="note note-info"><Icon name="tienda" size={20} /><span>Tenés productos de {groups.size} tiendas. Cada tienda recibe su pedido por separado.</span></div>
      )}
      {[...groups.entries()].map(([storeId, group], gi) => {
        const store = group[0].product.store
        const available = group.filter((l) => l.product.isAvailable)
        const subtotal = available.reduce((s, l) => s + l.product.price * l.quantity, 0)
        return (
          <section key={storeId} className="card rise" style={{ ['--i' as string]: gi, overflow: 'hidden' }} aria-label={`Pedido a ${store.name}`}>
            <div className="cg__head">
              <Avatar name={store.name} src={store.logoUrl} size={38} />
              <Link href={`/t/${store.slug}`} style={{ fontWeight: 800 }}>{store.name}</Link>
            </div>
            {group.map((l) => (
              <div key={l.productId} className="cl">
                <Link href={`/p/${l.productId}`} className="cl__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.product.imageUrl ? <img src={l.product.imageUrl} alt="" /> : <Svg html={productArt(l.productId, l.product.categorySlug)} />}
                </Link>
                <div className="stack" style={{ ['--gap' as string]: '8px' }}>
                  <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <Link href={`/p/${l.productId}`} style={{ flex: 1, fontWeight: 700, lineHeight: 1.3 }}>{l.product.name}</Link>
                    <span className="price">{formatPrice(l.product.price * l.quantity)}</span>
                  </div>
                  {l.product.isAvailable ? (
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="qty" role="group" aria-label="Cantidad">
                        <button type="button" onClick={() => cart.setQuantity(l.productId, l.quantity - 1)} aria-label="Menos">−</button>
                        <output>{l.quantity}</output>
                        <button type="button" onClick={() => cart.setQuantity(l.productId, l.quantity + 1)} aria-label="Más">+</button>
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => cart.remove(l.productId)}>
                        <Icon name="basura" size={18} /> Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="chip st-NUEVO">Agotado</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => cart.remove(l.productId)}>Quitar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="cg__foot">
              <div className="total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              {store.status !== 'ACTIVE' ? (
                <div className="note note-info">Esta tienda no está recibiendo pedidos por ahora.</div>
              ) : available.length > 0 ? (
                <Link href={`/carrito/${storeId}`} className="btn btn-primary btn-lg btn-block">
                  Hacer pedido a {store.name} <Icon name="flecha" size={18} />
                </Link>
              ) : null}
              <p className="small muted">El envío y la forma de pago los acordás con la tienda por WhatsApp.</p>
            </div>
          </section>
        )
      })}
    </div>
  )
}
