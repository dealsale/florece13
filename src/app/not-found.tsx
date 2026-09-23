import Link from 'next/link'
import { EmptyState } from '@/components/EmptyState'

export default function NotFound() {
  return (
    <div className="container section">
      <EmptyState icon="buscar" title="Esta página no existe o ya no está disponible." text="Puede que la tienda o el producto se hayan retirado.">
        <Link href="/" className="btn btn-primary">Volver al inicio</Link>
      </EmptyState>
    </div>
  )
}
