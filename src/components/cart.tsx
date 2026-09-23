'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type CartItem = { productId: string; storeId: string; quantity: number }

type CartContext = {
  items: CartItem[]
  ready: boolean
  count: number
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clearStore: (storeId: string) => void
  /** Aviso flotante ("agregado al carrito"). */
  toast: (message: string) => void
  /** Cambia en cada agregado: dispara la animación del contador. */
  bump: number
}

const KEY = 'f13_carrito_v1'
const MAX_QTY = 99
const Ctx = createContext<CartContext | null>(null)

function read(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw)
      ? raw.filter((i) => typeof i?.productId === 'string' && typeof i?.storeId === 'string' && i.quantity > 0)
      : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [bump, setBump] = useState(0)
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number } | null>(null)
  const toast = useCallback((text: string) => setToastMsg({ text, id: Date.now() }), [])
  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2400)
    return () => clearTimeout(t)
  }, [toastMsg])

  useEffect(() => {
    setItems(read())
    setReady(true)
    const onStorage = (e: StorageEvent) => e.key === KEY && setItems(read())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((update: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = update(prev)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const value = useMemo<CartContext>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      add: (item, quantity = 1) => {
        setBump((b) => b + 1)
        commit((prev) => {
          const found = prev.find((i) => i.productId === item.productId)
          if (found)
            return prev.map((i) =>
              i.productId === item.productId ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i,
            )
          return [...prev, { ...item, quantity }]
        })
      },
      setQuantity: (productId, quantity) =>
        commit((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)),
        ),
      remove: (productId) => commit((prev) => prev.filter((i) => i.productId !== productId)),
      clearStore: (storeId) => commit((prev) => prev.filter((i) => i.storeId !== storeId)),
      toast,
      bump,
    }),
    [items, ready, commit, toast, bump],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast ${toastMsg ? 'on' : ''}`} role="status" aria-live="polite">
        {toastMsg && (
          <>
            <i>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
            </i>
            <span>{toastMsg.text}</span>
          </>
        )}
      </div>
    </Ctx.Provider>
  )
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

export function CartCount() {
  const { count, ready, bump } = useCart()
  if (!ready || count === 0) return null
  return (
    <span key={bump} className={`badge ${bump ? 'bump' : ''}`} aria-label={`${count} en el carrito`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
