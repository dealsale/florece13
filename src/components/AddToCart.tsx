'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from './cart'
import { Icon } from './Icon'

export function AddToCart({ productId, storeId, name, compact = false }: { productId: string; storeId: string; name: string; compact?: boolean }) {
  const { add, items, toast } = useCart()
  const [qty, setQty] = useState(1)
  const inCart = items.find((i) => i.productId === productId)

  const onAdd = () => {
    add({ productId, storeId }, compact ? 1 : qty)
    toast(`${name} · agregado al carrito`)
  }

  if (compact) {
    return (
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        <Icon name="carrito" size={18} /> Agregar
      </button>
    )
  }

  return (
    <div className="stack" style={{ ['--gap' as string]: '10px' }}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <div className="qty" role="group" aria-label="Cantidad">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Más">+</button>
        </div>
        <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={onAdd}>
          <Icon name="carrito" size={20} /> Agregar al carrito
        </button>
      </div>
      {inCart && (
        <Link href="/carrito" className="small" style={{ fontWeight: 700, color: 'var(--verde)' }}>
          Tenés {inCart.quantity} en el carrito · Ver carrito →
        </Link>
      )}
    </div>
  )
}
