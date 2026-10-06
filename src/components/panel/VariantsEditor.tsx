'use client'

import { useMemo, useState } from 'react'
import type { ProductOption } from '@/db/schema'
import { MAX_OPTION_GROUPS, MAX_OPTION_VALUES, MAX_VARIANTS, combinations, variantKey, variantLabel } from '@/lib/variants'
import { Icon } from '../Icon'

/**
 * Opciones del producto (Color, Talla…) y sus combinaciones.
 * Cada valor puede tener una de las fotos del producto; cada combinación, su precio y si está disponible.
 * Manda un input oculto `variants` con { options, variants }.
 */

type Row = { price: string; available: boolean }
export type VariantDefaults = { options: ProductOption[]; variants: { values: string[]; price: number | null; isAvailable: boolean }[] }

const SUGGESTED = ['Color', 'Talla', 'Tamaño', 'Material', 'Personas']
const fmt = (n: number | null) => (n ? new Intl.NumberFormat('es-CO').format(n) : '')

export function VariantsEditor({ images, defaults, isService, error }: { images: string[]; defaults: VariantDefaults; isService: boolean; error?: string }) {
  const [options, setOptions] = useState<ProductOption[]>(defaults.options)
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(defaults.variants.map((v) => [variantKey(v.values), { price: fmt(v.price), available: v.isAvailable }])),
  )
  const [drafts, setDrafts] = useState<string[]>(['', ''])
  const [picking, setPicking] = useState<string | null>(null)

  const combos = useMemo(() => combinations(options), [options])
  const tooMany = combos.length > MAX_VARIANTS

  const payload = JSON.stringify({
    options,
    variants: combos.map((values) => {
      const r = rows[variantKey(values)]
      const digits = (r?.price ?? '').replace(/\D/g, '')
      return { values, price: digits ? Number(digits) : null, available: r?.available ?? true }
    }),
  })

  const setGroup = (gi: number, fn: (g: ProductOption) => ProductOption) => setOptions((os) => os.map((g, i) => (i === gi ? fn(g) : g)))
  const addValues = (gi: number, raw: string) => {
    const vals = raw.split(',').map((v) => v.trim()).filter(Boolean)
    if (!vals.length) return
    setGroup(gi, (g) => {
      const seen = new Set(g.values.map((v) => v.v.toLowerCase()))
      const add = vals.filter((v) => !seen.has(v.toLowerCase()) && seen.add(v.toLowerCase())).map((v) => ({ v: v.slice(0, 30) }))
      return { ...g, values: [...g.values, ...add].slice(0, MAX_OPTION_VALUES) }
    })
    setDrafts((d) => d.map((x, i) => (i === gi ? '' : x)))
  }
  const setRow = (key: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [key]: { ...(r[key] ?? { price: '', available: true }), ...patch } }))

  return (
    <div className="card pad form" data-tour="p-opciones">
      <input type="hidden" name="variants" value={payload} />
      <div>
        <h2 className="h3">Opciones <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>(opcional)</span></h2>
        <p className="hint" style={{ marginTop: 4 }}>
          {isService
            ? 'Por ejemplo: «Personas: 1, 2 a 4, Grupo» o «Duración: 1 hora, 2 horas». Cada opción puede tener su precio.'
            : 'Colores, tallas, tamaños… Cada combinación puede tener su precio, su foto y marcarse agotada.'}
        </p>
      </div>

      {options.map((g, gi) => (
        <div key={gi} className="vgroup">
          <div className="row" style={{ flexWrap: 'nowrap', ['--gap' as string]: '8px' }}>
            <input
              className="input"
              value={g.name}
              maxLength={30}
              placeholder={gi === 0 ? 'Nombre de la opción (Color)' : 'Nombre de la opción (Talla)'}
              aria-label="Nombre de la opción"
              onChange={(e) => setGroup(gi, (x) => ({ ...x, name: e.target.value }))}
            />
            <button type="button" className="icon-btn" aria-label="Quitar opción" onClick={() => setOptions((os) => os.filter((_, i) => i !== gi))}>
              <Icon name="basura" size={18} />
            </button>
          </div>
          {!g.name && (
            <div className="vsugg">
              {SUGGESTED.filter((n) => !options.some((o) => o.name === n)).map((n) => (
                <button key={n} type="button" className="pill" onClick={() => setGroup(gi, (x) => ({ ...x, name: n }))}>
                  {n}
                </button>
              ))}
            </div>
          )}
          <div className="vvals">
            {g.values.map((val, vi) => {
              const pk = `${gi}:${vi}`
              return (
                <span key={val.v} className={`vval${picking === pk ? ' on' : ''}`}>
                  {images.length > 0 && (
                    <button type="button" className="vval__img" aria-label={`Foto para ${val.v}`} onClick={() => setPicking(picking === pk ? null : pk)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {val.img ? <img src={val.img} alt="" /> : <Icon name="camara" size={14} />}
                    </button>
                  )}
                  {val.v}
                  <button type="button" className="vval__x" aria-label={`Quitar ${val.v}`} onClick={() => setGroup(gi, (x) => ({ ...x, values: x.values.filter((_, i) => i !== vi) }))}>
                    <Icon name="cerrar" size={12} />
                  </button>
                </span>
              )
            })}
            {g.values.length < MAX_OPTION_VALUES && (
              <input
                className="vvals__in"
                value={drafts[gi] ?? ''}
                placeholder={g.values.length ? 'Agregar…' : gi === 0 ? 'Negro, Blanco, Verde…' : 'S, M, L, XL…'}
                aria-label="Agregar valores"
                enterKeyHint="done"
                onChange={(e) => {
                  const v = e.target.value
                  if (v.includes(',')) addValues(gi, v)
                  else setDrafts((d) => d.map((x, i) => (i === gi ? v : x)))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addValues(gi, drafts[gi] ?? '')
                  }
                }}
                onBlur={() => addValues(gi, drafts[gi] ?? '')}
              />
            )}
          </div>
          {picking?.startsWith(`${gi}:`) && (
            <div className="vpick">
              <span className="small muted">Foto para «{g.values[Number(picking.split(':')[1])]?.v}»:</span>
              <div className="vpick__row">
                <button
                  type="button"
                  className="vpick__none"
                  onClick={() => {
                    const vi = Number(picking.split(':')[1])
                    setGroup(gi, (x) => ({ ...x, values: x.values.map((v, i) => (i === vi ? { ...v, img: null } : v)) }))
                    setPicking(null)
                  }}
                >
                  Sin foto
                </button>
                {images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    className="vpick__img"
                    onClick={() => {
                      const vi = Number(picking.split(':')[1])
                      setGroup(gi, (x) => ({ ...x, values: x.values.map((v, i) => (i === vi ? { ...v, img: src } : v)) }))
                      setPicking(null)
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {options.length < MAX_OPTION_GROUPS && (
        <button type="button" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setOptions((os) => [...os, { name: '', values: [] }])}>
          <Icon name="mas" size={16} /> {options.length === 0 ? 'Agregar opciones' : 'Agregar otra opción'}
        </button>
      )}

      {combos.length > 0 && !tooMany && (
        <div className="vtable" role="table" aria-label="Combinaciones">
          <div className="vtable__h" role="row">
            <span role="columnheader">Combinación</span>
            <span role="columnheader">Precio</span>
            <span role="columnheader">Disponible</span>
          </div>
          {combos.map((values) => {
            const key = variantKey(values)
            const r = rows[key] ?? { price: '', available: true }
            return (
              <div key={key} className={`vtable__r${r.available ? '' : ' off'}`} role="row">
                <span role="cell" className="vtable__l">{variantLabel(values)}</span>
                <span role="cell" className="prefix vtable__p">
                  <span>$</span>
                  <input
                    className="input tnum"
                    inputMode="numeric"
                    placeholder="Igual"
                    aria-label={`Precio de ${variantLabel(values)}`}
                    value={r.price}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 9)
                      setRow(key, { price: d ? new Intl.NumberFormat('es-CO').format(Number(d)) : '' })
                    }}
                  />
                </span>
                <span role="cell">
                  <button
                    type="button"
                    className="switch"
                    role="switch"
                    aria-checked={r.available}
                    aria-label={`${variantLabel(values)} disponible`}
                    onClick={() => setRow(key, { available: !r.available })}
                  />
                </span>
              </div>
            )
          })}
          <span className="hint">Sin precio propio, la combinación usa el precio de arriba.</span>
        </div>
      )}
      {tooMany && <span className="ferr">Son {combos.length} combinaciones; el máximo es {MAX_VARIANTS}. Quitá algunos valores.</span>}
      {error && <span className="ferr">{error}</span>}
    </div>
  )
}
