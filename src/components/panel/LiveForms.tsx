'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createDeal, createEvent, createJob, createStory } from '@/lib/actions/live'
import type { FormState } from '@/lib/actions/merchant'
import { EVENT_KINDS } from '@/lib/agenda'
import { Icon } from '../Icon'
import { SingleImageField } from '../ImageUploader'
import { uploadMedia } from '../upload'
import { useSubmit } from '../useSubmit'

/* Formularios de lo "en vivo": historia, Flash, evento y vacante. Cortos y pensados para el celular. */

type Tab = 'historia' | 'flash' | 'evento' | 'empleo'
const TABS: { key: Tab; label: string; icon: string; hint: string }[] = [
  { key: 'historia', label: 'Historia', icon: 'camara', hint: 'Foto o video que se ve 24 horas.' },
  { key: 'flash', label: 'Flash', icon: 'rayo', hint: 'Oferta que dura 1 hora, 3 horas o hoy.' },
  { key: 'evento', label: 'Evento', icon: 'evento', hint: 'Aparece en la Agenda 13.' },
  { key: 'empleo', label: 'Vacante', icon: 'maletin', hint: 'Lo ven en Oportunidades.' },
]

const onMoney = (e: React.FormEvent<HTMLInputElement>) => {
  const d = e.currentTarget.value.replace(/\D/g, '').slice(0, 9)
  e.currentTarget.value = d ? new Intl.NumberFormat('es-CO').format(Number(d)) : ''
}

function useLiveForm(action: (s: FormState, fd: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  const onSubmit = useSubmit(formAction)
  const ref = useRef<HTMLFormElement>(null)
  const [key, setKey] = useState(0)
  // Después de publicar, el formulario queda limpio para la próxima.
  useEffect(() => {
    if (state?.ok) setKey((k) => k + 1) // eslint-disable-line react-hooks/set-state-in-effect
  }, [state])
  return { state, onSubmit, pending, ref, key, err: (k: string) => state?.errors?.[k]?.[0] }
}

function Note({ state }: { state: FormState }) {
  if (!state?.message) return null
  return <div className={`note ${state.ok ? 'note-ok' : 'note-err'}`} role="status">{state.message}</div>
}

export function LiveForms({ defaultPlace, initial = 'historia' }: { defaultPlace: string; initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial)
  return (
    <div className="stack" style={{ ['--gap' as string]: '14px' }}>
      <div className="live-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={20} />
            <b>{t.label}</b>
            <small>{t.hint}</small>
          </button>
        ))}
      </div>
      {tab === 'historia' && <StoryForm />}
      {tab === 'flash' && <DealForm />}
      {tab === 'evento' && <EventForm defaultPlace={defaultPlace} />}
      {tab === 'empleo' && <JobForm />}
    </div>
  )
}

function StoryForm() {
  const f = useLiveForm(createStory)
  const [media, setMedia] = useState<{ url: string; mediaType: 'image' | 'video' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (f.state?.ok) setMedia(null) // eslint-disable-line react-hooks/set-state-in-effect
  }, [f.state])
  return (
    <form key={f.key} ref={f.ref} onSubmit={f.onSubmit} className="card pad form" noValidate>
      <input type="hidden" name="mediaUrl" value={media?.url ?? ''} />
      <input type="hidden" name="mediaType" value={media?.mediaType ?? 'image'} />
      <label className={`story-up${busy ? ' shimmer' : ''}`}>
        {media ? (
          media.mediaType === 'video' ? (
            <video src={media.url} muted playsInline autoPlay loop />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt="" />
          )
        ) : (
          !busy && (
            <span className="story-up__e">
              <Icon name="camara" size={30} />
              <b>Tomá una foto o grabá un video</b>
              <small>Vertical queda mejor. Video de hasta 40 MB.</small>
            </span>
          )
        )}
        <input
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          className="vh"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setBusy(true)
            setError('')
            try {
              setMedia(await uploadMedia(file, 'historia'))
            } catch (err) {
              setError((err as Error).message)
            }
            setBusy(false)
          }}
        />
      </label>
      {error && <span className="ferr">{error}</span>}
      <div className="field">
        <label htmlFor="caption">Texto <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
        <input id="caption" name="caption" className="input" maxLength={140} placeholder="Acaban de salir empanadas 🔥" />
      </div>
      <Note state={f.state} />
      <button type="submit" className="btn btn-primary btn-lg" disabled={f.pending || busy || !media}>
        {f.pending ? 'Publicando…' : 'Publicar historia'}
      </button>
    </form>
  )
}

function DealForm() {
  const f = useLiveForm(createDeal)
  const [duration, setDuration] = useState('3h')
  return (
    <form key={f.key} ref={f.ref} onSubmit={f.onSubmit} className="card pad form" noValidate>
      <div className="field">
        <label htmlFor="d-title">¿Qué ofrecés?</label>
        <input id="d-title" name="title" className="input" maxLength={80} placeholder="2 perros + gaseosa" aria-invalid={Boolean(f.err('title'))} />
        {f.err('title') && <span className="ferr">{f.err('title')}</span>}
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label htmlFor="d-price">Precio oferta</label>
          <div className="prefix"><span>$</span><input id="d-price" name="price" className="input tnum" inputMode="numeric" onInput={onMoney} aria-invalid={Boolean(f.err('price'))} /></div>
          {f.err('price') && <span className="ferr">{f.err('price')}</span>}
        </div>
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label htmlFor="d-orig">Precio normal</label>
          <div className="prefix"><span>$</span><input id="d-orig" name="originalPrice" className="input tnum" inputMode="numeric" onInput={onMoney} /></div>
        </div>
      </div>
      <div className="field">
        <span className="flabel">¿Cuánto dura?</span>
        <input type="hidden" name="duration" value={duration} />
        <div className="cchips">
          {[
            ['1h', '1 hora'],
            ['3h', '3 horas'],
            ['hoy', 'Hasta esta noche'],
          ].map(([k, l]) => (
            <button key={k} type="button" className={`cchip${duration === k ? ' on' : ''}`} onClick={() => setDuration(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <SingleImageField name="imageUrl" tipo="producto" label="Foto (opcional)" />
      <div className="field">
        <label htmlFor="d-desc">Detalle <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
        <input id="d-desc" name="description" className="input" maxLength={300} placeholder="Solo en el local · hasta agotar existencias" />
      </div>
      <Note state={f.state} />
      <button type="submit" className="btn btn-primary btn-lg" disabled={f.pending}>
        <Icon name="rayo" size={18} /> {f.pending ? 'Publicando…' : 'Lanzar Flash'}
      </button>
      <span className="hint">Les avisamos a quienes te siguen y a quienes pidieron ofertas cerca.</span>
    </form>
  )
}

function EventForm({ defaultPlace }: { defaultPlace: string }) {
  const f = useLiveForm(createEvent)
  const [kind, setKind] = useState('musica')
  return (
    <form key={f.key} ref={f.ref} onSubmit={f.onSubmit} className="card pad form" noValidate>
      <div className="field">
        <label htmlFor="e-title">Nombre del evento</label>
        <input id="e-title" name="title" className="input" maxLength={100} placeholder="Freestyle en la terraza" aria-invalid={Boolean(f.err('title'))} />
        {f.err('title') && <span className="ferr">{f.err('title')}</span>}
      </div>
      <div className="field">
        <span className="flabel">Tipo</span>
        <input type="hidden" name="category" value={kind} />
        <div className="cchips">
          {EVENT_KINDS.map((k) => (
            <button key={k.key} type="button" className={`cchip${kind === k.key ? ' on' : ''}`} onClick={() => setKind(k.key)}>
              <Icon name={k.icon} size={14} /> {k.name}
            </button>
          ))}
        </div>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: '1 1 200px' }}>
          <label htmlFor="e-start">Empieza</label>
          <input id="e-start" name="startsAt" type="datetime-local" className="input" aria-invalid={Boolean(f.err('startsAt'))} />
          {f.err('startsAt') && <span className="ferr">{f.err('startsAt')}</span>}
        </div>
        <div className="field" style={{ flex: '1 1 200px' }}>
          <label htmlFor="e-end">Termina <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
          <input id="e-end" name="endsAt" type="datetime-local" className="input" />
        </div>
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: '2 1 220px' }}>
          <label htmlFor="e-place">Lugar</label>
          <input id="e-place" name="place" className="input" maxLength={140} defaultValue={defaultPlace} placeholder="Terraza de la tienda, escaleras eléctricas tramo 3" />
        </div>
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label htmlFor="e-price">Entrada</label>
          <div className="prefix"><span>$</span><input id="e-price" name="price" className="input tnum" inputMode="numeric" placeholder="Libre" onInput={onMoney} /></div>
        </div>
      </div>
      <SingleImageField name="imageUrl" tipo="portada" label="Imagen (opcional)" />
      <div className="field">
        <label htmlFor="e-desc">Descripción</label>
        <textarea id="e-desc" name="description" className="textarea" maxLength={1000} placeholder="Quién toca, qué hay que llevar, cupos…" />
      </div>
      <Note state={f.state} />
      <button type="submit" className="btn btn-primary btn-lg" disabled={f.pending}>{f.pending ? 'Publicando…' : 'Publicar en la Agenda 13'}</button>
    </form>
  )
}

const SCHEDULES = ['Tiempo completo', 'Medio tiempo', 'Fines de semana', 'Por días', 'Por proyecto']

function JobForm() {
  const f = useLiveForm(createJob)
  const [schedule, setSchedule] = useState(SCHEDULES[0])
  return (
    <form key={f.key} ref={f.ref} onSubmit={f.onSubmit} className="card pad form" noValidate>
      <div className="field">
        <label htmlFor="j-title">¿A quién buscás?</label>
        <input id="j-title" name="title" className="input" maxLength={80} placeholder="Se busca barbero" aria-invalid={Boolean(f.err('title'))} />
        {f.err('title') && <span className="ferr">{f.err('title')}</span>}
      </div>
      <div className="field">
        <span className="flabel">Horario</span>
        <input type="hidden" name="schedule" value={schedule} />
        <div className="cchips">
          {SCHEDULES.map((s) => (
            <button key={s} type="button" className={`cchip${schedule === s ? ' on' : ''}`} onClick={() => setSchedule(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="j-pay">Pago <span className="muted" style={{ fontWeight: 500 }}>(opcional)</span></label>
        <input id="j-pay" name="pay" className="input" maxLength={80} placeholder="$ 1.400.000 + propinas" />
      </div>
      <div className="field">
        <label htmlFor="j-desc">Qué necesitás</label>
        <textarea id="j-desc" name="description" className="textarea" maxLength={1000} placeholder="Experiencia, días, qué va a hacer…" />
      </div>
      <Note state={f.state} />
      <button type="submit" className="btn btn-primary btn-lg" disabled={f.pending}>{f.pending ? 'Publicando…' : 'Publicar vacante'}</button>
      <span className="hint">Se postulan por WhatsApp. Queda publicada 30 días.</span>
    </form>
  )
}
