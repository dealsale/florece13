import type { Metadata } from 'next'
import { EmptyState } from '@/components/EmptyState'

export const metadata: Metadata = { title: 'Sin conexión', robots: { index: false } }

/** La guarda el service worker y la muestra cuando el celular se queda sin internet. */
export default function Offline() {
  return (
    <div className="wrap sec">
      <EmptyState title="Estás sin conexión." text="Revisá los datos o el wifi. Apenas vuelva la señal, seguís mirando las tiendas de la 13.">
        {/* Enlace normal (no <Link>): recarga la página completa desde la red. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="btn btn-primary">Intentar de nuevo</a>
      </EmptyState>
    </div>
  )
}
