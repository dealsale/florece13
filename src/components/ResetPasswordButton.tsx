'use client'

import { useActionState } from 'react'
import { resetOwnerPassword, type ResetState } from '@/lib/actions/admin'

export function ResetPasswordButton({ storeId }: { storeId: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetOwnerPassword.bind(null, storeId), null)
  if (state?.password) {
    return (
      <span className="chip chip-light" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
        Clave temporal: <strong className="tnum" style={{ userSelect: 'all' }}>{state.password}</strong>
      </span>
    )
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('¿Generar una clave nueva para el dueño de esta tienda? Su clave actual deja de funcionar.')) e.preventDefault()
      }}
    >
      <button type="submit" className="btn btn-ghost btn-sm" disabled={pending}>{pending ? 'Generando…' : 'Nueva clave'}</button>
    </form>
  )
}
