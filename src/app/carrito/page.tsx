import type { Metadata } from 'next'
import { CartView } from './CartView'

export const metadata: Metadata = { title: 'Carrito' }

export default function CarritoPage() {
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <section className="stack" style={{ paddingTop: 28 }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 20 }}>casi listo</span>
        <h1 className="h1" style={{ marginBottom: 8 }}>Tu carrito</h1>
        <CartView />
      </section>
    </div>
  )
}
