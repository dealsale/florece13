'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { Icon } from '@/components/Icon'
import { formatPrice } from '@/lib/format'
import { createOrder, type OrderState } from '../actions'
import { useCartProducts } from '../useCartProducts'
import { useSubmit } from '@/components/useSubmit'

type StoreInfo = { id: string; name: string; slug: string; shipsNationwide: boolean; allowsPickup: boolean; sector: string; address: string }

export function CheckoutForm({ store }: { store: StoreInfo }) {
  const router = useRouter()
  const { cart, lines } = useCartProducts()
  const [state, action, pending] = useActionState<OrderState, FormData>(createOrder, null)
  const onSubmit = useSubmit(action)
  const [delivery, setDelivery] = useState<'ENVIO' | 'RECOGER'>(store.shipsNationwide ? 'ENVIO' : 'RECOGER')

  useEffect(() => {
    if (state?.ok) {
      cart.clearStore(store.id)
      router.replace(`/pedido/${state.orderId}?nuevo=1`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (!cart.ready || lines === null) return <div className="loading-block" style={{ height: 320 }} />

  const mine = lines.filter((l) => l.storeId === store.id && l.product.isAvailable)
  if (mine.length === 0 && !state?.ok) {
    return (
      <div className="empty">
        <p className="empty__title">No tenés productos de esta tienda en el carrito.</p>
        <Link href={`/t/${store.slug}`} className="btn btn-primary">Ver la tienda</Link>
      </div>
    )
  }
  const total = mine.reduce((s, l) => s + l.product.price * l.quantity, 0)
  const err = (k: string) => (state && !state.ok ? state.errors?.[k]?.[0] : undefined)

  return (
    <form onSubmit={onSubmit} className="checkout-layout" noValidate>
      <input type="hidden" name="storeId" value={store.id} />
      <input type="hidden" name="items" value={JSON.stringify(mine.map((l) => ({ productId: l.productId, quantity: l.quantity })))} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>No llenar <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="card card-pad form">
        <h2 className="subtitle">Tus datos</h2>
        <div className="field">
          <label htmlFor="customerName">Nombre</label>
          <input id="customerName" name="customerName" className="input" autoComplete="name" required aria-invalid={Boolean(err('customerName'))} />
          {err('customerName') && <span className="field-error">{err('customerName')}</span>}
        </div>
        <div className="field">
          <label htmlFor="customerPhone">Celular (WhatsApp)</label>
          <div className="input-prefix">
            <span>+57</span>
            <input id="customerPhone" name="customerPhone" className="input" inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" required aria-invalid={Boolean(err('customerPhone'))} />
          </div>
          <span className="field-hint">La tienda te escribe aquí para confirmar. Si estás fuera de Colombia, escribí el número con el código de tu país.</span>
          {err('customerPhone') && <span className="field-error">{err('customerPhone')}</span>}
        </div>
        <div className="field">
          <label htmlFor="customerEmail">Correo <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
          <input id="customerEmail" name="customerEmail" type="email" className="input" autoComplete="email" aria-invalid={Boolean(err('customerEmail'))} />
          {err('customerEmail') && <span className="field-error">{err('customerEmail')}</span>}
        </div>

        <h2 className="subtitle" style={{ marginTop: 8 }}>Entrega</h2>
        <div className="choice-group" role="radiogroup">
          {store.shipsNationwide && (
            <label className="choice">
              <input type="radio" name="deliveryMethod" value="ENVIO" checked={delivery === 'ENVIO'} onChange={() => setDelivery('ENVIO')} />
              <span><strong>Envío</strong><br /><span className="small muted">A cualquier ciudad del país</span></span>
            </label>
          )}
          {store.allowsPickup && (
            <label className="choice">
              <input type="radio" name="deliveryMethod" value="RECOGER" checked={delivery === 'RECOGER'} onChange={() => setDelivery('RECOGER')} />
              <span><strong>Recoger</strong><br /><span className="small muted">{store.sector ? `En ${store.sector}, Comuna 13` : 'En la tienda'}</span></span>
            </label>
          )}
        </div>
        {delivery === 'ENVIO' ? (
          <>
            <div className="field">
              <label htmlFor="city">Ciudad</label>
              <input id="city" name="city" className="input" autoComplete="address-level2" aria-invalid={Boolean(err('city'))} />
              {err('city') && <span className="field-error">{err('city')}</span>}
            </div>
            <div className="field">
              <label htmlFor="address">Dirección</label>
              <input id="address" name="address" className="input" autoComplete="street-address" placeholder="Calle, número, apto, barrio" aria-invalid={Boolean(err('address'))} />
              {err('address') && <span className="field-error">{err('address')}</span>}
            </div>
          </>
        ) : (
          store.address && <p className="small muted"><Icon name="ubicacion" size={14} style={{ verticalAlign: '-2px' }} /> {store.address}</p>
        )}
        <div className="field">
          <label htmlFor="notes">Nota para la tienda <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
          <textarea id="notes" name="notes" className="textarea" style={{ minHeight: 88 }} placeholder="Talla, color, un detalle para regalo…" maxLength={500} />
        </div>
      </div>

      <aside className="card card-pad stack" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="subtitle">Resumen</h2>
        <div>
          {mine.map((l) => (
            <div key={l.productId} className="summary-line">
              <span>{l.quantity} × {l.product.name}</span>
              <span className="tnum" style={{ whiteSpace: 'nowrap' }}>{formatPrice(l.product.price * l.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="totals" style={{ borderTop: '1px solid var(--linea)', paddingTop: 12 }}>
          <span>Total productos</span>
          <strong className="tnum">{formatPrice(total)}</strong>
        </div>
        <p className="small muted">El costo del envío y la forma de pago (Nequi, transferencia, contraentrega…) los acordás con la tienda.</p>
        {state && !state.ok && state.message && <div className="alert alert-error" role="alert">{state.message}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
          {pending ? 'Guardando pedido…' : 'Continuar al WhatsApp de la tienda'}
        </button>
        <p className="small muted">Guardamos tu pedido y te llevamos al chat con la tienda para enviarlo.</p>
      </aside>
    </form>
  )
}
