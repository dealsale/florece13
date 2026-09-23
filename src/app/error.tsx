'use client'

import { EmptyState } from '@/components/EmptyState'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container section">
      <EmptyState icon="florece" title="Algo salió mal de nuestro lado." text="Intentá de nuevo en un momento.">
        <button type="button" className="btn btn-primary" onClick={reset}>Intentar de nuevo</button>
      </EmptyState>
    </div>
  )
}
