'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/components/cart'
import { getCartProducts, type CartProduct } from './actions'

/** Cruza el carrito local con los datos actuales de la base (precio, disponibilidad, tienda). */
export function useCartProducts() {
  const cart = useCart()
  const [products, setProducts] = useState<CartProduct[] | null>(null)
  const idsKey = cart.items.map((i) => i.productId).sort().join(',')

  useEffect(() => {
    if (!cart.ready) return
    let alive = true
    getCartProducts(idsKey ? idsKey.split(',') : []).then((rows) => alive && setProducts(rows))
    return () => {
      alive = false
    }
  }, [cart.ready, idsKey])

  const lines = useMemo(
    () =>
      products === null
        ? null
        : cart.items.flatMap((item) => {
            const product = products.find((p) => p.id === item.productId)
            return product ? [{ ...item, product }] : []
          }),
    [cart.items, products],
  )

  // Productos borrados de la base: se sacan del carrito.
  useEffect(() => {
    if (products === null) return
    for (const item of cart.items) if (!products.some((p) => p.id === item.productId)) cart.remove(item.productId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  return { cart, lines }
}

export type CartLine = NonNullable<ReturnType<typeof useCartProducts>['lines']>[number]
