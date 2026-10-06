'use client'

import { useEffect, useMemo, useState } from 'react'
import { lineKey, useCart } from '@/components/cart'
import { variantImage, variantLabel } from '@/lib/variants'
import { getCartProducts, type CartProduct } from './actions'

/** Cruza el carrito local con los datos actuales de la base (precio, disponibilidad, opción elegida, tienda). */
export function useCartProducts() {
  const cart = useCart()
  const [products, setProducts] = useState<CartProduct[] | null>(null)
  const idsKey = [...new Set(cart.items.map((i) => i.productId))].sort().join(',')

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
            if (!product) return []
            const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined
            const needsOption = product.hasOptions && !variant
            const label = variant ? variantLabel(variant.values) : ''
            return [
              {
                ...item,
                key: lineKey(item),
                product,
                variant,
                label,
                needsOption,
                price: variant?.price ?? product.price,
                // Los servicios se reservan por WhatsApp: si quedó alguno en el carrito, no se puede pedir.
                available: product.isAvailable && product.kind === 'PRODUCTO' && !needsOption && (!variant || variant.isAvailable),
                image: (variant && variantImage(product.options, variant.values)) || product.imageUrl,
              },
            ]
          }),
    [cart.items, products],
  )

  // Productos o combinaciones borrados de la base: se sacan del carrito.
  useEffect(() => {
    if (products === null) return
    for (const item of cart.items) {
      const p = products.find((x) => x.id === item.productId)
      if (!p || (item.variantId && !p.variants.some((v) => v.id === item.variantId))) cart.remove(lineKey(item))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  return { cart, lines }
}

export type CartLine = NonNullable<ReturnType<typeof useCartProducts>['lines']>[number]
