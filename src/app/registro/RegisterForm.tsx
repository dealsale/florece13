'use client'

import { useActionState } from 'react'
import { register, type AuthState } from '@/lib/actions/auth'
import { useSubmit } from '@/components/useSubmit'

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, null)
  const onSubmit = useSubmit(action)
  const err = (k: string) => state?.errors?.[k]?.[0]
  return (
    <form onSubmit={onSubmit} className="card pad form rise" style={{ ['--i' as string]: 1 }} noValidate>
      <div className="field">
        <label htmlFor="name">Tu nombre</label>
        <input id="name" name="name" className="input" autoComplete="name" required defaultValue={state?.values?.name} aria-invalid={Boolean(err('name'))} />
        {err('name') && <span className="ferr">{err('name')}</span>}
      </div>
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required defaultValue={state?.values?.email} aria-invalid={Boolean(err('email'))} />
        {err('email') && <span className="ferr">{err('email')}</span>}
      </div>
      <div className="field">
        <label htmlFor="password">Clave</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required aria-invalid={Boolean(err('password'))} />
        <span className="hint">Mínimo 8 caracteres.</span>
        {err('password') && <span className="ferr">{err('password')}</span>}
      </div>
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>{pending ? 'Creando cuenta…' : 'Crear cuenta'}</button>
    </form>
  )
}
