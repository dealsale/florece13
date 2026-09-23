type Errors = Record<string, string[] | undefined> | undefined

export type StoreBasics = {
  name?: string
  tagline?: string
  categoryId?: string | null
  whatsapp?: string
  sector?: string
  instagram?: string
}

function localPhone(e164?: string) {
  if (!e164) return ''
  return e164.startsWith('57') && e164.length === 12 ? e164.slice(2) : e164
}

export function StoreBasicsFields({
  categories,
  sectores,
  errors,
  defaults = {},
}: {
  categories: { id: string; name: string }[]
  sectores: string[]
  errors: Errors
  defaults?: StoreBasics
}) {
  const err = (k: string) => errors?.[k]?.[0]
  return (
    <>
      <div className="field">
        <label htmlFor="name">Nombre de la tienda</label>
        <input id="name" name="name" className="input" maxLength={60} required defaultValue={defaults.name} aria-invalid={Boolean(err('name'))} />
        {err('name') && <span className="ferr">{err('name')}</span>}
      </div>
      <div className="field">
        <label htmlFor="tagline">Frase corta <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
        <input id="tagline" name="tagline" className="input" maxLength={120} defaultValue={defaults.tagline} placeholder="Mochilas tejidas a mano en la parte alta de la 13" />
        {err('tagline') && <span className="ferr">{err('tagline')}</span>}
      </div>
      <div className="field">
        <label htmlFor="categoryId">¿Qué vendés?</label>
        <select id="categoryId" name="categoryId" className="select" required defaultValue={defaults.categoryId ?? ''} aria-invalid={Boolean(err('categoryId'))}>
          <option value="" disabled>Elegí una categoría</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {err('categoryId') && <span className="ferr">{err('categoryId')}</span>}
      </div>
      <div className="field">
        <label htmlFor="whatsapp">WhatsApp de la tienda</label>
        <div className="prefix">
          <span>+57</span>
          <input id="whatsapp" name="whatsapp" className="input" inputMode="tel" required placeholder="300 123 4567" defaultValue={localPhone(defaults.whatsapp)} aria-invalid={Boolean(err('whatsapp'))} />
        </div>
        <span className="hint">Aquí te llegan los pedidos.</span>
        {err('whatsapp') && <span className="ferr">{err('whatsapp')}</span>}
      </div>
      <div className="field">
        <label htmlFor="sector">Sector de la Comuna 13</label>
        <select id="sector" name="sector" className="select" defaultValue={defaults.sector ?? ''}>
          <option value="">Elegí tu sector</option>
          {sectores.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="instagram">Instagram <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
        <div className="prefix">
          <span>@</span>
          <input id="instagram" name="instagram" className="input" defaultValue={defaults.instagram} autoCapitalize="none" aria-invalid={Boolean(err('instagram'))} />
        </div>
        {err('instagram') && <span className="ferr">{err('instagram')}</span>}
      </div>
    </>
  )
}
