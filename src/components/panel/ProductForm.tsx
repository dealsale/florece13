'use client'

import { useActionState, useCallback, useState } from 'react'
import { ImageUploader } from '../ImageUploader'
import { Icon } from '../Icon'
import { CategoryChips } from './CategoryChips'
import { VariantsEditor, type VariantDefaults } from './VariantsEditor'
import { createProduct, deleteProduct, updateProduct, type FormState } from '@/lib/actions/merchant'
import { useSubmit } from '@/components/useSubmit'

type Defaults = {
  kind?: 'PRODUCTO' | 'SERVICIO'
  name?: string
  description?: string
  price?: number
  compareAtPrice?: number | null
  priceFrom?: boolean
  duration?: string
  categoryIds?: string[]
  isAvailable?: boolean
  images: string[]
  variants?: VariantDefaults
}

const fmt = (n?: number | null) => (n ? new Intl.NumberFormat('es-CO').format(n) : '')

export function ProductForm({
  productId,
  categories,
  defaults,
}: {
  productId?: string
  categories: { id: string; name: string; icon?: string }[]
  defaults: Defaults
}) {
  const action = productId ? updateProduct.bind(null, productId) : createProduct
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  const onSubmit = useSubmit(formAction)
  const err = (k: string) => state?.errors?.[k]?.[0]
  const [kind, setKind] = useState<'PRODUCTO' | 'SERVICIO'>(defaults.kind ?? 'PRODUCTO')
  const [images, setImages] = useState<string[]>(defaults.images)
  const onImages = useCallback((urls: string[]) => setImages(urls), [])
  const service = kind === 'SERVICIO'
  const noun = service ? 'servicio' : 'producto'

  // Formatea el precio mientras se escribe: 89900 → 89.900
  const onMoney = (e: React.FormEvent<HTMLInputElement>) => {
    const digits = e.currentTarget.value.replace(/\D/g, '').slice(0, 9)
    e.currentTarget.value = digits ? new Intl.NumberFormat('es-CO').format(Number(digits)) : ''
  }

  return (
    <>
      <form onSubmit={onSubmit} className="form" noValidate>
        <input type="hidden" name="kind" value={kind} />
        <div className="seg" role="radiogroup" aria-label="¿Qué vas a publicar?">
          <button type="button" role="radio" aria-checked={!service} className={!service ? 'on' : ''} onClick={() => setKind('PRODUCTO')}>
            <Icon name="carrito" size={18} /> Producto
            <small>Se pide con el carrito</small>
          </button>
          <button type="button" role="radio" aria-checked={service} className={service ? 'on' : ''} onClick={() => setKind('SERVICIO')}>
            <Icon name="experiencia" size={18} /> Servicio o experiencia
            <small>Se reserva por WhatsApp</small>
          </button>
        </div>

        <div className="card pad form">
          <div className="field">
            <span className="flabel">Fotos</span>
            <ImageUploader name="images" initial={defaults.images} onChange={onImages} />
            {err('images') && <span className="ferr">{err('images')}</span>}
          </div>
          <div className="field">
            <label htmlFor="name">Nombre del {noun}</label>
            <input
              id="name"
              name="name"
              className="input"
              maxLength={100}
              required
              defaultValue={defaults.name}
              placeholder={service ? 'Tour de grafiti por la 13' : 'Mochila wayuu tejida a mano'}
              aria-invalid={Boolean(err('name'))}
            />
            {err('name') && <span className="ferr">{err('name')}</span>}
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="field" style={{ flex: '1 1 160px' }}>
              <label htmlFor="price">Precio</label>
              <div className="prefix">
                <span>$</span>
                <input id="price" name="price" className="input tnum" inputMode="numeric" required defaultValue={fmt(defaults.price)} onInput={onMoney} aria-invalid={Boolean(err('price'))} />
              </div>
              {err('price') && <span className="ferr">{err('price')}</span>}
            </div>
            <div className="field" style={{ flex: '1 1 160px' }}>
              <label htmlFor="compareAtPrice">Precio antes <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
              <div className="prefix">
                <span>$</span>
                <input id="compareAtPrice" name="compareAtPrice" className="input tnum" inputMode="numeric" defaultValue={fmt(defaults.compareAtPrice)} onInput={onMoney} />
              </div>
              <span className="hint">Si está en oferta, aparece tachado.</span>
            </div>
          </div>
          {service && (
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="field" style={{ flex: '1 1 200px' }}>
                <label htmlFor="duration">Duración <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
                <input id="duration" name="duration" className="input" maxLength={60} defaultValue={defaults.duration} placeholder="2 horas" />
              </div>
              <label className="check" style={{ flex: '1 1 200px', marginTop: 26 }}>
                <input type="checkbox" name="priceFrom" defaultChecked={defaults.priceFrom ?? false} />
                <span><strong>Mostrar «Desde»</strong><br /><span className="small muted">Si el precio cambia según el grupo o lo que pidan.</span></span>
              </label>
            </div>
          )}
          <CategoryChips
            name="categoryIds"
            label="Categorías"
            categories={categories}
            initial={defaults.categoryIds}
            max={3}
            error={err('categoryIds')}
            tour="p-categorias"
          />
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              maxLength={3000}
              defaultValue={defaults.description}
              placeholder={service ? 'Qué incluye, punto de encuentro, para cuántas personas, quién lo guía…' : 'Material, medidas, tallas, cuánto se demora en hacerse, quién lo hace…'}
            />
            {err('description') && <span className="ferr">{err('description')}</span>}
          </div>
          <label className="check">
            <input type="checkbox" name="isAvailable" defaultChecked={defaults.isAvailable ?? true} />
            <span>
              <strong>Disponible</strong>
              <br />
              <span className="small muted">{service ? 'Desmarcalo si por ahora no estás tomando reservas.' : 'Desmarcalo si se te agotó; sigue visible como agotado.'}</span>
            </span>
          </label>
        </div>

        <VariantsEditor images={images} defaults={defaults.variants ?? { options: [], variants: [] }} isService={service} error={err('variants')} />

        {state?.message && <div className={`note ${state.ok ? 'note-ok' : 'note-err'}`} role="status">{state.message}</div>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={pending} style={{ alignSelf: 'flex-start' }} data-tour="p-publicar">
          {pending ? 'Guardando…' : productId ? 'Guardar cambios' : `Publicar ${noun}`}
        </button>
      </form>

      {productId && (
        <form
          action={deleteProduct.bind(null, productId)}
          onSubmit={(e) => {
            if (!confirm(`¿Borrar este ${noun}? No se puede deshacer.`)) e.preventDefault()
          }}
          style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--linea)' }}
        >
          <button type="submit" className="btn btn-danger btn-sm">Borrar {noun}</button>
        </form>
      )}
    </>
  )
}
