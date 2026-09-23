'use client'

import { useActionState } from 'react'
import { login, type AuthState } from '@/lib/actions/auth'
import { useSubmit } from '@/components/useSubmit'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, null)
  const onSubmit = useSubmit(action)
  return (
    <form onSubmit={onSubmit} className="card card-pad form">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required defaultValue={state?.values?.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Clave</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state?.message && <div className="alert alert-error" role="alert">{state.message}</div>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
    </form>
  )
}
