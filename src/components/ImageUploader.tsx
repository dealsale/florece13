'use client'

import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { uploadImage } from './upload'

const MAX = 6

/** Fotos del producto: varias, ordenables. La primera es la portada. Guarda las URLs en un input oculto. */
export function ImageUploader({ name, initial = [] }: { name: string; initial?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial)
  const [busy, setBusy] = useState(0)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')
    const list = [...files].slice(0, MAX - urls.length)
    setBusy(list.length)
    for (const f of list) {
      try {
        const url = await uploadImage(f, 'producto')
        setUrls((u) => [...u, url].slice(0, MAX))
      } catch (e) {
        setError((e as Error).message)
      }
      setBusy((b) => b - 1)
    }
    if (input.current) input.current.value = ''
  }

  const move = (i: number, d: -1 | 1) =>
    setUrls((u) => {
      const next = [...u]
      ;[next[i], next[i + d]] = [next[i + d], next[i]]
      return next
    })

  return (
    <div className="stack" style={{ ['--gap' as string]: '8px' }}>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />
      <div className="uploader">
        {urls.map((url, i) => (
          <div key={url} className="uploader__item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} />
            {i === 0 && <span className="chip">Principal</span>}
            <button type="button" className="uploader__remove" onClick={() => setUrls((u) => u.filter((x) => x !== url))} aria-label="Quitar foto">
              <Icon name="cerrar" size={16} />
            </button>
            {urls.length > 1 && (
              <div className="uploader__move">
                {i > 0 && <button type="button" onClick={() => move(i, -1)} aria-label="Mover antes">◀</button>}
                {i < urls.length - 1 && <button type="button" onClick={() => move(i, 1)} aria-label="Mover después">▶</button>}
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => <div key={`b${i}`} className="uploader__item loading-block" />)}
        {urls.length + busy < MAX && (
          <label className="uploader__add">
            <Icon name="camara" size={26} />
            {urls.length === 0 ? 'Agregar fotos' : 'Agregar'}
            <input ref={input} type="file" accept="image/*" multiple className="visually-hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
        )}
      </div>
      <span className="field-hint">Hasta {MAX} fotos. La primera es la principal. Fondo liso, luz de día, una sola pieza por foto.</span>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

/** Una sola imagen (logo o portada de la tienda). */
export function SingleImageField({
  name,
  tipo,
  initial,
  label,
  hint,
}: {
  name: string
  tipo: 'logo' | 'portada'
  initial?: string | null
  label: string
  hint?: string
}) {
  const [url, setUrl] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const onFile = async (f?: File) => {
    if (!f) return
    setBusy(true)
    setError('')
    try {
      setUrl(await uploadImage(f, tipo))
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="image-field">
        <div className={`image-field__preview ${tipo === 'portada' ? 'image-field__preview--wide' : ''} ${busy ? 'loading-block' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="" /> : !busy && <Icon name="camara" size={28} />}
        </div>
        <div className="row" style={{ ['--gap' as string]: '8px' }}>
          <label className="btn btn-outline btn-sm">
            {url ? 'Cambiar' : 'Subir foto'}
            <input type="file" accept="image/*" className="visually-hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {url && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUrl('')}>Quitar</button>}
        </div>
      </div>
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
