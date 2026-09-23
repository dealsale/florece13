import type { Metadata } from 'next'
import { CartView } from './CartView'

export const metadata: Metadata = { title: 'Carrito' }

export default function CarritoPage() {
  return (
    <div className="container">
      <section className="section" style={{ paddingTop: 28 }}>
        <h1 className="title" style={{ marginBottom: 20 }}>Tu carrito</h1>
        <CartView />
      </section>
    </div>
  )
}
