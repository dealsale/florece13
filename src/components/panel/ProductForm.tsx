'use client'

import { useActionState } from 'react'
import { ImageUploader } from '../ImageUploader'
import { createProduct, deleteProduct, updateProduct, type FormState } from '@/lib/actions/merchant'
import { useSubmit } from '@/components/useSubmit'

type Defaults = {
  name?: string
  description?: string
  price?: number
  compareAtPrice?: number | null
  categoryId?: string | null
  isAvailable?: boolean
  images: string[]
}

const fmt = (n?: number | null) => (n ? new Intl.NumberFormat('es-CO').format(n) : '')

export function ProductForm({
  productId,
  categories,
  defaults,
}: {
  productId?: string
  categories: { id: string; name: string }[]
  defaults: Defaults
}) {
  const action = productId ? updateProduct.bind(null, productId) : createProduct
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  const onSubmit = useSubmit(formAction)
  const err = (k: string) => state?.errors?.[k]?.[0]

  // Formatea el precio mientras se escribe: 89900 → 89.900
  const onMoney = (e: React.FormEvent<HTMLInputElement>) => {
    const digits = e.currentTarget.value.replace(/\D/g, '').slice(0, 9)
    e.currentTarget.value = digits ? new Intl.NumberFormat('es-CO').format(Number(digits)) : ''
  }

  return (
    <>
      <form onSubmit={onSubmit} className="form" noValidate>
        <div className="card pad form">
          <div className="field">
            <span className="flabel">Fotos</span>
            <ImageUploader name="images" initial={defaults.images} />
            {err('images') && <span className="ferr">{err('images')}</span>}
          </div>
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" className="input" maxLength={100} required defaultValue={defaults.name} placeholder="Mochila wayuu tejida a mano" aria-invalid={Boolean(err('name'))} />
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
          <div className="field">
            <label htmlFor="categoryId">Categoría</label>
            <select id="categoryId" name="categoryId" className="select" required defaultValue={defaults.categoryId ?? ''} aria-invalid={Boolean(err('categoryId'))}>
              <option value="" disabled>Elegí una categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err('categoryId') && <span className="ferr">{err('categoryId')}</span>}
          </div>
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" className="textarea" maxLength={3000} defaultValue={defaults.description} placeholder="Material, medidas, tallas, cuánto se demora en hacerse, quién lo hace…" />
            {err('description') && <span className="ferr">{err('description')}</span>}
          </div>
          <label className="check">
            <input type="checkbox" name="isAvailable" defaultChecked={defaults.isAvailable ?? true} />
            <span><strong>Disponible</strong><br /><span className="small muted">Desmarcalo si se te agotó; el producto sigue visible como agotado.</span></span>
          </label>
        </div>
        {state?.message && <div className={`note ${state.ok ? "note-ok" : "note-err"}`} role="status">{state.message}</div>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={pending} style={{ alignSelf: 'flex-start' }}>
          {pending ? 'Guardando…' : productId ? 'Guardar cambios' : 'Publicar producto'}
        </button>
      </form>

      {productId && (
        <form
          action={deleteProduct.bind(null, productId)}
          onSubmit={(e) => {
            if (!confirm('¿Borrar este producto? No se puede deshacer.')) e.preventDefault()
          }}
          style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--linea)' }}
        >
          <button type="submit" className="btn btn-danger btn-sm">Borrar producto</button>
        </form>
      )}
    </>
  )
}
