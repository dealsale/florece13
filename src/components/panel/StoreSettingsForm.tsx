'use client'

import { useActionState } from 'react'
import type { Store } from '@/db/schema'
import { updateStore, type FormState } from '@/lib/actions/merchant'
import { SingleImageField } from '../ImageUploader'
import { StoreBasicsFields } from './StoreBasicsFields'
import { useSubmit } from '@/components/useSubmit'

export function StoreSettingsForm({
  store,
  categories,
  sectores,
}: {
  store: Store
  categories: { id: string; name: string }[]
  sectores: string[]
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateStore, null)
  const onSubmit = useSubmit(action)
  const err = (k: string) => state?.errors?.[k]?.[0]
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <div className="card pad form">
        <h2 className="h3">Imagen</h2>
        <SingleImageField name="logoUrl" tipo="logo" initial={store.logoUrl} label="Logo o foto tuya" hint="Cuadrada. Si no tenés logo, una foto tuya en el local funciona muy bien." />
        <SingleImageField name="coverUrl" tipo="portada" initial={store.coverUrl} label="Portada" hint="Horizontal: tu local, tu taller, tus manos trabajando. Foto real, nada de stock." />
      </div>
      <div className="card pad form">
        <h2 className="h3">Datos</h2>
        <StoreBasicsFields categories={categories} sectores={sectores} errors={state?.errors} defaults={store} />
        <div className="field">
          <label htmlFor="address">Dirección o punto de referencia <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
          <input id="address" name="address" className="input" maxLength={200} defaultValue={store.address} placeholder="Frente a las escaleras eléctricas, tramo 3" />
        </div>
      </div>
      <div className="card pad form">
        <h2 className="h3">Tu historia</h2>
        <div className="field">
          <label htmlFor="story" className="vh">Historia</label>
          <textarea id="story" name="story" className="textarea" style={{ minHeight: 180 }} maxLength={3000} defaultValue={store.story} placeholder="¿Quién hace lo que vendés? ¿Desde cuándo? ¿Qué lo hace de la 13?" aria-invalid={Boolean(err('story'))} />
          <span className="hint">Los compradores quieren saber quién está detrás. Contalo con tus palabras.</span>
          {err('story') && <span className="ferr">{err('story')}</span>}
        </div>
      </div>
      <div className="card pad form">
        <h2 className="h3">Entregas</h2>
        <label className="check">
          <input type="checkbox" name="shipsNationwide" defaultChecked={store.shipsNationwide} />
          <span><strong>Hago envíos a todo el país</strong><br /><span className="small muted">El costo del envío lo acordás con cada comprador.</span></span>
        </label>
        <label className="check">
          <input type="checkbox" name="allowsPickup" defaultChecked={store.allowsPickup} />
          <span><strong>Se puede recoger en la tienda</strong></span>
        </label>
      </div>
      {state?.message && <div className={`note ${state.ok ? "note-ok" : "note-err"}`} role="status">{state.message}</div>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Guardando…' : 'Guardar cambios'}</button>
    </form>
  )
}
