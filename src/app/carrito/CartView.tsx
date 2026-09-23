'use client'

import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { formatPrice } from '@/lib/format'
import { useCartProducts, type CartLine } from './useCartProducts'

export function CartView() {
  const { cart, lines } = useCartProducts()

  if (!cart.ready || lines === null) return <div className="loading-block" style={{ height: 240 }} />

  if (lines.length === 0) {
    return (
      <EmptyState icon="carrito" title="Tu carrito está vacío." text="Explorá lo que se hace en la 13 y agregá lo que te guste.">
        <Link href="/buscar" className="btn btn-primary">Explorar productos</Link>
      </EmptyState>
    )
  }

  const groups = new Map<string, CartLine[]>()
  for (const l of lines) groups.set(l.storeId, [...(groups.get(l.storeId) ?? []), l])

  return (
    <div className="stack" style={{ ['--gap' as string]: '20px' }}>
      {groups.size > 1 && (
        <div className="alert alert-info">Tenés productos de {groups.size} tiendas. Cada tienda recibe su pedido por separado.</div>
      )}
      {[...groups.entries()].map(([storeId, group]) => {
        const store = group[0].product.store
        const closed = store.status !== 'ACTIVE'
        const available = group.filter((l) => l.product.isAvailable)
        const subtotal = available.reduce((s, l) => s + l.product.price * l.quantity, 0)
        return (
          <section key={storeId} className="card cart-group" aria-label={`Pedido a ${store.name}`}>
            <div className="cart-group__head">
              <Avatar name={store.name} src={store.logoUrl} size={36} />
              <Link href={`/t/${store.slug}`} style={{ fontWeight: 700, color: 'var(--cemento)' }}>{store.name}</Link>
            </div>
            {group.map((l) => (
              <div key={l.productId} className="cart-line">
                <Link href={`/p/${l.productId}`} className="cart-line__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.product.imageUrl ? <img src={l.product.imageUrl} alt="" /> : <div className="no-photo"><Icon name="camara" /></div>}
                </Link>
                <div className="stack" style={{ ['--gap' as string]: '8px' }}>
                  <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <Link href={`/p/${l.productId}`} className="cart-line__name" style={{ flex: 1 }}>{l.product.name}</Link>
                    <span className="price tnum">{formatPrice(l.product.price * l.quantity)}</span>
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
                      <span className="chip chip-warn">Agotado</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => cart.remove(l.productId)}>Quitar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="cart-group__foot">
              <div className="totals">
                <span>Subtotal</span>
                <strong className="tnum">{formatPrice(subtotal)}</strong>
              </div>
              {closed ? (
                <div className="alert alert-info">Esta tienda no está recibiendo pedidos por ahora.</div>
              ) : (
                <Link
                  href={`/carrito/${storeId}`}
                  className="btn btn-primary btn-lg btn-block"
                  aria-disabled={available.length === 0}
                  onClick={(e) => available.length === 0 && e.preventDefault()}
                >
                  Hacer pedido a {store.name}
                </Link>
              )}
              <p className="small muted">El envío y la forma de pago los acordás con la tienda por WhatsApp.</p>
            </div>
          </section>
        )
      })}
    </div>
  )
}
