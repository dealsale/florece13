'use client'

import { useState } from 'react'
import type { StoreHours } from '@/db/schema'
import { DAY_NAMES } from '@/lib/time'

const DEFAULT: StoreHours = DAY_NAMES.map((_, i) => ({ closed: i === 6, open: '09:00', close: '19:00' }))

/** Horario semanal. Sin horario publicado, el negocio no muestra "Abierto/Cerrado". */
export function HoursEditor({ initial }: { initial: StoreHours | null }) {
  const [on, setOn] = useState(Boolean(initial))
  const [hours, setHours] = useState<StoreHours>(initial ?? DEFAULT)
  const set = (i: number, patch: Partial<StoreHours[number]>) => setHours((h) => h.map((d, j) => (j === i ? { ...d, ...patch } : d)))

  return (
    <div className="field">
      <input type="hidden" name="hours" value={on ? JSON.stringify(hours) : ''} />
      <label className="check">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <span><strong>Publicar mi horario</strong><br /><span className="small muted">Así la gente ve si estás abierto ahora.</span></span>
      </label>
      {on && (
        <div className="hours">
          {hours.map((d, i) => (
            <div key={i} className={`hours__r${d.closed ? ' off' : ''}`}>
              <span className="hours__d">{DAY_NAMES[i]}</span>
              <button type="button" className="switch" role="switch" aria-checked={!d.closed} aria-label={`${DAY_NAMES[i]} abierto`} onClick={() => set(i, { closed: !d.closed })} />
              {d.closed ? (
                <span className="small muted">Cerrado</span>
              ) : (
                <span className="hours__t">
                  <input type="time" className="input" value={d.open} aria-label={`${DAY_NAMES[i]} abre`} onChange={(e) => set(i, { open: e.target.value })} />
                  <span>a</span>
                  <input type="time" className="input" value={d.close} aria-label={`${DAY_NAMES[i]} cierra`} onChange={(e) => set(i, { close: e.target.value })} />
                </span>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" style={{ justifySelf: 'start' }} onClick={() => setHours((h) => h.map((d) => ({ ...d, open: h[0].open, close: h[0].close })))}>
            Copiar el horario del lunes a todos
          </button>
        </div>
      )}
    </div>
  )
}
