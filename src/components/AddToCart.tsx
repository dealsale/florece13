'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from './cart'
import { Icon } from './Icon'

export function AddToCart({ productId, storeId, compact = false }: { productId: string; storeId: string; compact?: boolean }) {
  const { add, items } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.productId === productId)

  const onAdd = () => {
    add({ productId, storeId }, compact ? 1 : qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  if (compact) {
    return (
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        {added ? <><Icon name="check" size={18} /> Agregado</> : 'Agregar'}
      </button>
    )
  }

  return (
    <div className="stack" style={{ ['--gap' as string]: '10px' }}>
      <div className="row">
        <div className="qty" role="group" aria-label="Cantidad">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Más">+</button>
        </div>
        <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={onAdd}>
          {added ? <><Icon name="check" size={18} /> Agregado al carrito</> : 'Agregar al carrito'}
        </button>
      </div>
      {inCart && (
        <Link href="/carrito" className="small" style={{ fontWeight: 700 }}>
          Tenés {inCart.quantity} en el carrito · Ver carrito
        </Link>
      )}
    </div>
  )
}
