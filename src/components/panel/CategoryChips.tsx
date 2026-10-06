'use client'

import { useState } from 'react'
import { Icon } from '../Icon'

/**
 * Selección de varias categorías con chips. La primera elegida queda como principal.
 * Manda un input oculto `name` con el JSON de los ids en orden.
 */
export function CategoryChips({
  name,
  categories,
  initial = [],
  max = 3,
  label,
  hint,
  error,
  tour,
}: {
  name: string
  categories: { id: string; name: string; icon?: string }[]
  initial?: string[]
  max?: number
  label: string
  hint?: string
  error?: string
  tour?: string
}) {
  const [ids, setIds] = useState<string[]>(initial.filter((id) => categories.some((c) => c.id === id)))
  const toggle = (id: string) =>
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= max ? cur : [...cur, id]))

  return (
    <div className="field" data-tour={tour}>
      <span className="flabel">{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(ids)} />
      <div className="cchips" role="group" aria-label={label} aria-invalid={Boolean(error)}>
        {categories.map((c) => {
          const on = ids.includes(c.id)
          const main = ids[0] === c.id && ids.length > 1
          return (
            <button key={c.id} type="button" className={`cchip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(c.id)} disabled={!on && ids.length >= max}>
              {on ? <Icon name="check" size={14} /> : c.icon ? <Icon name={c.icon} size={14} /> : null}
              {c.name}
              {main && <span className="cchip__main">principal</span>}
            </button>
          )
        })}
      </div>
      <span className="hint">{hint ?? `Elegí hasta ${max}. La primera es la principal.`}</span>
      {error && <span className="ferr">{error}</span>}
    </div>
  )
}
