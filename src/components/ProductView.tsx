'use client'

import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ProductOption } from '@/db/schema'
import { variantImage, variantLabel } from '@/lib/variants'
import { productMessage, serviceMessage, waLink } from '@/lib/whatsapp'
import { useCart } from './cart'
import { Icon } from './Icon'
import { Price } from './Price'

/**
 * Ficha de producto/servicio en el navegador: la opción elegida (Color, Talla…) mueve a la vez
 * la foto de la galería, el precio, el botón de compra/reserva, el mensaje de WhatsApp y la barra de abajo.
 */

export type ProductViewData = {
  id: string
  name: string
  kind: 'PRODUCTO' | 'SERVICIO'
  price: number
  compareAtPrice: number | null
  priceFrom: boolean
  isAvailable: boolean
  storeId: string
  whatsapp: string
  url: string
  rich: boolean
  options: ProductOption[]
  variants: { id: string; values: string[]; price: number | null; isAvailable: boolean }[]
}

type Ctx = {
  p: ProductViewData
  selected: string[]
  select: (group: number, value: string) => void
  variant: ProductViewData['variants'][number] | null
  /** Todas las opciones elegidas. */
  complete: boolean
  price: number
  available: boolean
  image: string | null
  label: string
  wa: string
}

const ViewCtx = createContext<Ctx | null>(null)
export const useProductView = () => useContext(ViewCtx)

export function ProductViewProvider({ data, children }: { data: ProductViewData; children: ReactNode }) {
  const hasOptions = data.options.length > 0
  // Arranca con la primera combinación disponible (así el precio de entrada es real).
  const [selected, setSelected] = useState<string[]>(() => (hasOptions ? (data.variants.find((v) => v.isAvailable) ?? data.variants[0])?.values ?? [] : []))
  const [touchedImage, setTouchedImage] = useState(false)

  const value = useMemo<Ctx>(() => {
    const complete = !hasOptions || (selected.length === data.options.length && selected.every(Boolean))
    const variant = hasOptions && complete ? (data.variants.find((v) => v.values.every((x, i) => x === selected[i])) ?? null) : null
    const price = variant?.price ?? data.price
    const available = data.isAvailable && (!hasOptions || Boolean(variant?.isAvailable))
    const label = variant ? variantLabel(variant.values) : ''
    const image = hasOptions && touchedImage ? variantImage(data.options, selected) : null
    const message =
      data.kind === 'SERVICIO'
        ? serviceMessage(data.name, price, data.priceFrom && !variant?.price, data.url, data.rich, label)
        : productMessage(data.name, price, data.url, data.rich, label)
    return {
      p: data,
      selected,
      select: (group, v) => {
        setTouchedImage(true)
        setSelected((cur) => {
          const next = [...cur]
          next[group] = v
          return next
        })
      },
      variant,
      complete,
      price,
      available,
      image,
      label,
      wa: waLink(data.whatsapp, message),
    }
  }, [data, selected, hasOptions, touchedImage])

  return <ViewCtx.Provider value={value}>{children}</ViewCtx.Provider>
}

/** Precio (cambia con la opción) y chips de opciones. */
export function ProductPriceAndOptions() {
  const ctx = useProductView()!
  const { p, selected, select, variant, price } = ctx
  const showFrom = p.priceFrom && !variant?.price
  return (
    <>
      <div className="p-price">
        {showFrom && <span className="p-price__from">Desde</span>}
        <Price value={price} compareAt={variant?.price ? null : p.compareAtPrice} />
      </div>
      {p.options.map((g, gi) => (
        <div key={g.name + gi} className="opt" role="radiogroup" aria-label={g.name}>
          <div className="opt__t">
            {g.name}
            {selected[gi] && <b>: {selected[gi]}</b>}
          </div>
          <div className="opt__vals">
            {g.values.map((val) => {
              // ¿Hay alguna combinación disponible con este valor y lo demás que ya se eligió?
              const possible = p.variants.some((v) => v.isAvailable && v.values[gi] === val.v && v.values.every((x, i) => i === gi || !selected[i] || x === selected[i]))
              const on = selected[gi] === val.v
              return (
                <button
                  key={val.v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`opt__v${on ? ' on' : ''}${possible ? '' : ' out'}${val.img ? ' img' : ''}`}
                  onClick={() => select(gi, val.v)}
                  title={possible ? val.v : `${val.v} · agotado`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {val.img && <img src={val.img} alt="" />}
                  <span>{val.v}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

/** Botones principales: agregar al carrito (productos) o reservar por WhatsApp (servicios). */
export function ProductActions({ compact = false }: { compact?: boolean }) {
  const ctx = useProductView()!
  const { add, items, toast } = useCart()
  const [qty, setQty] = useState(1)
  const { p, variant, available, complete, label, wa } = ctx
  const service = p.kind === 'SERVICIO'
  const inCart = items.find((i) => i.productId === p.id && (i.variantId ?? null) === (variant?.id ?? null))

  const addToCart = () => {
    add({ productId: p.id, storeId: p.storeId, variantId: variant?.id }, compact ? 1 : qty)
    toast(label ? `Agregado: ${p.name} (${label})` : `${p.name} · agregado al carrito`)
  }

  if (!p.isAvailable) {
    if (compact) return null
    return <div className="note note-info">{service ? 'Por ahora no está tomando reservas. Escribile a la tienda para saber cuándo vuelve.' : 'Por ahora está agotado. Escribile a la tienda para saber cuándo vuelve.'}</div>
  }

  if (service) {
    return (
      <a className={`btn btn-wa ${compact ? '' : 'btn-lg btn-block'}`} href={wa} target="_blank" rel="noopener noreferrer" aria-disabled={!available}>
        <Icon name="whatsapp" size={20} /> {compact ? 'Reservar' : 'Reservar por WhatsApp'}
      </a>
    )
  }

  if (compact) {
    return (
      <>
        <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={20} /> WhatsApp
        </a>
        <button type="button" className="btn btn-primary" onClick={addToCart} disabled={!available}>
          <Icon name="carrito" size={18} /> {available ? 'Agregar' : 'Agotado'}
        </button>
      </>
    )
  }

  return (
    <div className="stack" style={{ ['--gap' as string]: '10px' }}>
      {!complete ? (
        <div className="note note-info">Elegí una opción para continuar.</div>
      ) : !available ? (
        <div className="note note-info">{label ? `${label} está agotado.` : 'Agotado.'} Probá otra opción o escribile a la tienda.</div>
      ) : null}
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <div className="qty" role="group" aria-label="Cantidad">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Más">+</button>
        </div>
        <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={addToCart} disabled={!available}>
          <Icon name="carrito" size={20} /> Agregar al carrito
        </button>
      </div>
      <a className="btn btn-wa btn-lg btn-block" href={wa} target="_blank" rel="noopener noreferrer">
        <Icon name="whatsapp" size={20} /> Pedir por WhatsApp
      </a>
      {inCart && (
        <Link href="/carrito" className="small" style={{ fontWeight: 700, color: 'var(--verde)' }}>
          Tenés {inCart.quantity} en el carrito · Ver carrito →
        </Link>
      )}
    </div>
  )
}

/** Barra fija de abajo en el celular. */
export function ProductBuyBar() {
  const ctx = useProductView()
  if (!ctx?.p.isAvailable) return null
  return (
    <div className="buybar">
      <ProductActions compact />
    </div>
  )
}
