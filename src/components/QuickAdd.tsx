'use client'

import { useState } from 'react'
import { useCart } from './cart'
import { Icon } from './Icon'

export function QuickAdd({ productId, storeId, name }: { productId: string; storeId: string; name: string }) {
  const { add, toast } = useCart()
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={`prod__add ${done ? 'done' : ''}`}
      aria-label={`Agregar ${name} al carrito`}
      onClick={() => {
        add({ productId, storeId })
        toast(`${name} · agregado al carrito`)
        setDone(true)
        setTimeout(() => setDone(false), 1200)
      }}
    >
      <Icon name={done ? 'check' : 'mas'} size={20} />
    </button>
  )
}
