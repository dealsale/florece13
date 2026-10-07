'use client'

import { useActionState, useEffect, useState } from 'react'
import { createTalent, deleteTalent, type TalentState } from '@/lib/actions/talent'
import { SECTORES } from '@/lib/orders'
import { useSubmit } from '../useSubmit'

const KEY = 'f13_mi_perfil_trabajo'
type Mine = { id: string; token: string; trade: string }

/** Publicar (o borrar) el perfil de "Busco trabajo". La clave para borrarlo queda en este celular. */
export function TalentForm() {
  const [state, action, pending] = useActionState<TalentState, FormData>(createTalent, null)
  const onSubmit = useSubmit(action)
  const [mine, setMine] = useState<Mine | null>(null)
  const err = (k: string) => state?.errors?.[k]?.[0]

  useEffect(() => {
    try {
      setMine(JSON.parse(localStorage.getItem(KEY) ?? 'null')) // eslint-disable-line react-hooks/set-state-in-effect
    } catch {}
  }, [])
  useEffect(() => {
    if (state?.ok && state.id && state.token) {
      const m = { id: state.id, token: state.token, trade: String(document.querySelector<HTMLInputElement>('#t-trade')?.value ?? '') }
      try {
        localStorage.setItem(KEY, JSON.stringify(m))
      } catch {}
      setMine(m) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [state])

  if (mine) {
    return (
      <div className="card pad stack" style={{ ['--gap' as string]: '10px' }}>
        <div className="note note-ok">Tu perfil «{mine.trade || 'Busco trabajo'}» está publicado. Los negocios te escriben por WhatsApp.</div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={async () => {
            if (!confirm('¿Borrar tu perfil?')) return
            await deleteTalent(mine.id, mine.token)
            try {
              localStorage.removeItem(KEY)
            } catch {}
            setMine(null)
          }}
        >
          Borrar mi perfil
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="card pad form" noValidate>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>No llenar <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="field">
        <label htmlFor="t-name">Tu nombre</label>
        <input id="t-name" name="name" className="input" maxLength={60} autoComplete="name" aria-invalid={Boolean(err('name'))} />
        {err('name') && <span className="ferr">{err('name')}</span>}
      </div>
      <div className="field">
        <label htmlFor="t-trade">¿Qué sabés hacer?</label>
        <input id="t-trade" name="trade" className="input" maxLength={60} placeholder="Barbero, mesero, diseñador, domiciliario…" aria-invalid={Boolean(err('trade'))} />
        {err('trade') && <span className="ferr">{err('trade')}</span>}
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: '1 1 180px' }}>
          <label htmlFor="t-sector">Sector</label>
          <select id="t-sector" name="sector" className="select" defaultValue="">
            <option value="">Comuna 13</option>
            {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 180px' }}>
          <label htmlFor="t-av">Disponibilidad</label>
          <input id="t-av" name="availability" className="input" maxLength={60} placeholder="Fines de semana, tardes…" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="t-about">Contá un poco <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
        <textarea id="t-about" name="about" className="textarea" maxLength={500} placeholder="Experiencia, cursos, en qué te destacás…" />
      </div>
      <div className="field">
        <label htmlFor="t-wa">WhatsApp</label>
        <div className="prefix"><span>+57</span><input id="t-wa" name="whatsapp" className="input" inputMode="tel" placeholder="300 123 4567" aria-invalid={Boolean(err('whatsapp'))} /></div>
        {err('whatsapp') && <span className="ferr">{err('whatsapp')}</span>}
      </div>
      {state?.message && !state.ok && <div className="note note-err">{state.message}</div>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>{pending ? 'Publicando…' : 'Publicar mi perfil'}</button>
      <span className="hint">Queda publicado 60 días. Solo lo ven negocios registrados en Florece 13.</span>
    </form>
  )
}
