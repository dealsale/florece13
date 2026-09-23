'use client'

import { useActionState } from 'react'
import { StoreBasicsFields } from '@/components/panel/StoreBasicsFields'
import { createStore, type FormState } from '@/lib/actions/merchant'
import { useSubmit } from '@/components/useSubmit'

export function CreateStoreForm(props: { categories: { id: string; name: string }[]; sectores: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createStore, null)
  const onSubmit = useSubmit(action)
  return (
    <form onSubmit={onSubmit} className="card pad form rise" style={{ ['--i' as string]: 1 }} noValidate>
      <StoreBasicsFields {...props} errors={state?.errors} />
      {state?.message && <div className="note note-err" role="alert">{state.message}</div>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>{pending ? 'Creando…' : 'Crear mi tienda'}</button>
      <p className="small muted">
        Revisamos cada tienda nueva para confirmar que es de la Comuna 13. Mientras tanto ya podés subir tus productos.
      </p>
    </form>
  )
}
