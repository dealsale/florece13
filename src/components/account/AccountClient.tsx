'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { claimOrders, followedStores, updateProfile } from '@/lib/actions/account'
import type { FormState } from '@/lib/actions/merchant'
import { Avatar } from '../Avatar'
import { myOrderIds } from '../live/myOrders'
import { useDevice } from '../live/useDevice'
import { useSubmit } from '../useSubmit'

/** Suma a la cuenta los pedidos hechos antes desde este celular y muestra las tiendas que sigue. */
export function AccountClient({ orderIds }: { orderIds: string[] }) {
  const router = useRouter()
  const { state } = useDevice()
  const [stores, setStores] = useState<Awaited<ReturnType<typeof followedStores>>>([])
  useEffect(() => {
    const local = myOrderIds().filter((id) => !orderIds.includes(id))
    if (local.length) claimOrders(local).then((r) => r.claimed && router.refresh())
  }, [orderIds, router])
  const key = state?.follows.join(',') ?? ''
  useEffect(() => {
    if (key) followedStores(key.split(',')).then(setStores)
  }, [key])
  if (stores.length === 0) return null
  return (
    <section className="sec" style={{ paddingBottom: 0 }}>
      <h2 className="h3" style={{ marginBottom: 10 }}>Tiendas que seguís</h2>
      <div className="follows">
        {stores.map((s) => (
          <Link key={s.id} href={`/t/${s.slug}`} className="follows__it">
            <Avatar name={s.name} src={s.logoUrl} size={56} />
            <span>{s.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function ProfileForm({ defaults }: { defaults: { name: string; phone: string; city: string; address: string; email: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, null)
  const onSubmit = useSubmit(action)
  const err = (k: string) => state?.errors?.[k]?.[0]
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <div className="field">
        <label htmlFor="p-name">Nombre</label>
        <input id="p-name" name="name" className="input" defaultValue={defaults.name} autoComplete="name" aria-invalid={Boolean(err('name'))} />
        {err('name') && <span className="ferr">{err('name')}</span>}
      </div>
      <div className="field">
        <label htmlFor="p-phone">Celular (WhatsApp)</label>
        <div className="prefix"><span>+57</span><input id="p-phone" name="phone" className="input" inputMode="tel" defaultValue={defaults.phone} autoComplete="tel-national" aria-invalid={Boolean(err('phone'))} /></div>
        {err('phone') && <span className="ferr">{err('phone')}</span>}
      </div>
      <div className="field">
        <label htmlFor="p-city">Ciudad</label>
        <input id="p-city" name="city" className="input" defaultValue={defaults.city} autoComplete="address-level2" />
      </div>
      <div className="field">
        <label htmlFor="p-address">Dirección de entrega</label>
        <input id="p-address" name="address" className="input" defaultValue={defaults.address} autoComplete="street-address" />
      </div>
      <span className="hint">Correo: {defaults.email}</span>
      {state?.message && <div className={`note ${state.ok ? 'note-ok' : 'note-err'}`} role="status">{state.message}</div>}
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</button>
    </form>
  )
}
