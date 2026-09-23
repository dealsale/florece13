'use client'

import { EmptyState } from '@/components/EmptyState'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap sec">
      <EmptyState motif="escalera" title="Algo salió mal de nuestro lado." text="Intentá de nuevo en un momento.">
        <button type="button" className="btn btn-primary" onClick={reset}>Intentar de nuevo</button>
        {error.digest && <p className="small muted">Código del error: {error.digest}</p>}
      </EmptyState>
    </div>
  )
}
