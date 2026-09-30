'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon'

/**
 * Recorrido guiado para tiendas nuevas.
 * Oscurece la pantalla, ilumina un elemento a la vez y, en los pasos de "hacer", espera a que el
 * comerciante lo haga de verdad (subir el logo, escribir la historia, crear el primer producto…)
 * antes de seguir. El avance se guarda en el celular (localStorage) por tienda.
 */

export type TourProgress = { hasLogo: boolean; hasCover: boolean; storyOk: boolean; products: number }

type Mode =
  | { kind: 'next' } // solo informa: botón "Siguiente"
  | { kind: 'click' } // hay que tocar el elemento iluminado (normalmente navega)
  | { kind: 'until'; done: () => boolean; hint: string } // hay que completar algo

type Step = {
  id: string
  path: RegExp
  /** Adónde mandar si el comerciante se fue a otra página. */
  home: string
  target?: string
  title: string
  body: string
  mode: Mode
  skip?: (p: TourProgress) => boolean
}

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)
const val = (sel: string) => ($<HTMLInputElement>(sel)?.value ?? '').trim()
const storeReady = (p: TourProgress) => p.hasLogo && p.hasCover && p.storyOk

const STEPS: Step[] = [
  {
    id: 'hola',
    path: /^\/panel$/,
    home: '/panel',
    title: '¡Bienvenido a tu tienda!',
    body: 'Te acompaño a dejarla lista para vender: tu imagen, tu portada, tu historia y tu primer producto. Son unos minutos y aprendés a usar todo.',
    mode: { kind: 'next' },
  },
  {
    id: 'numeros',
    path: /^\/panel$/,
    home: '/panel',
    target: '[data-tour="kpis"]',
    title: 'Tus números',
    body: 'Pedidos nuevos, lo que vendiste en el mes y tus productos. Tocá cualquier tarjeta para ir directo al detalle.',
    mode: { kind: 'next' },
  },
  {
    id: 'pedidos',
    path: /^\/panel$/,
    home: '/panel',
    target: '[data-tour="nav-pedidos"]',
    title: 'Aquí llegan tus pedidos',
    body: 'Cada pedido te llega también por WhatsApp. Desde aquí lo confirmás, lo marcás como enviado y le escribís al cliente con un toque.',
    mode: { kind: 'next' },
  },
  {
    id: 'lista',
    path: /^\/panel$/,
    home: '/panel',
    target: '[data-tour="checklist"]',
    title: 'Tu lista para florecer',
    body: 'Estos son los pasos para completar tu tienda. Los vamos a hacer juntos, uno por uno.',
    mode: { kind: 'next' },
    skip: (p) => storeReady(p) && p.products >= 5,
  },
  {
    id: 'ir-tienda',
    path: /^\/panel$/,
    home: '/panel',
    target: '[data-tour="nav-tienda"]',
    title: 'Empecemos por tu imagen',
    body: 'Tocá «Mi tienda».',
    mode: { kind: 'click' },
    skip: storeReady,
  },
  {
    id: 'logo',
    path: /^\/panel\/tienda$/,
    home: '/panel/tienda',
    target: '.field:has(input[name="logoUrl"])',
    title: 'Tu logo o una foto tuya',
    body: 'Tocá «Subir foto». Cuadrada funciona mejor. Si no tenés logo, una foto tuya en el local queda perfecta.',
    mode: { kind: 'until', done: () => Boolean(val('input[name="logoUrl"]')), hint: 'Esperando la foto…' },
    skip: storeReady,
  },
  {
    id: 'portada',
    path: /^\/panel\/tienda$/,
    home: '/panel/tienda',
    target: '.field:has(input[name="coverUrl"])',
    title: 'Ahora la portada',
    body: 'Una foto horizontal de tu local, tu taller o tus manos trabajando. Es lo primero que ven los compradores.',
    mode: { kind: 'until', done: () => Boolean(val('input[name="coverUrl"]')), hint: 'Esperando la portada…' },
    skip: storeReady,
  },
  {
    id: 'historia',
    path: /^\/panel\/tienda$/,
    home: '/panel/tienda',
    target: '#story',
    title: 'Contá tu historia',
    body: '¿Quién hace lo que vendés? ¿Desde cuándo? ¿Qué lo hace de la 13? Con dos o tres frases basta.',
    mode: {
      kind: 'until',
      done: () => val('#story').length > 40,
      hint: 'Escribí al menos 40 letras',
    },
    skip: storeReady,
  },
  {
    id: 'guardar',
    path: /^\/panel\/tienda$/,
    home: '/panel/tienda',
    target: '[data-tour="t-guardar"]',
    title: 'Guardá los cambios',
    body: 'Tocá «Guardar cambios» y tu tienda queda con su cara nueva.',
    mode: { kind: 'until', done: () => Boolean($('.note.note-ok')), hint: 'Tocá «Guardar cambios»' },
    skip: storeReady,
  },
  {
    id: 'ir-productos',
    path: /^\/panel(\/tienda)?$/,
    home: '/panel',
    target: '[data-tour="nav-productos"]',
    title: 'Ahora, tu primer producto',
    body: 'Tocá «Productos».',
    mode: { kind: 'click' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'nuevo',
    path: /^\/panel\/productos$/,
    home: '/panel/productos',
    target: '[data-tour="p-nuevo"]',
    title: 'Publicá un producto',
    body: 'Tocá «Nuevo».',
    mode: { kind: 'click' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'fotos',
    path: /^\/panel\/productos\/nuevo$/,
    home: '/panel/productos/nuevo',
    target: '.up',
    title: 'Fotos del producto',
    body: 'Tocá «Agregar fotos». Fondo liso y luz de día. La primera es la principal; podés subir hasta 6.',
    mode: { kind: 'until', done: () => !['', '[]'].includes(val('input[name="images"]')), hint: 'Esperando al menos una foto…' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'nombre',
    path: /^\/panel\/productos\/nuevo$/,
    home: '/panel/productos/nuevo',
    target: '#name',
    title: '¿Cómo se llama?',
    body: 'Un nombre claro, como lo buscaría un cliente: «Mochila wayuu tejida a mano».',
    mode: { kind: 'until', done: () => val('#name').length >= 3, hint: 'Escribí el nombre' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'precio',
    path: /^\/panel\/productos\/nuevo$/,
    home: '/panel/productos/nuevo',
    target: '#price',
    title: '¿Cuánto cuesta?',
    body: 'Solo el número, en pesos. Los puntos los ponemos nosotros.',
    mode: { kind: 'until', done: () => /\d{3,}/.test(val('#price').replace(/\D/g, '')), hint: 'Escribí el precio' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'categoria',
    path: /^\/panel\/productos\/nuevo$/,
    home: '/panel/productos/nuevo',
    target: '#categoryId',
    title: 'Elegí la categoría',
    body: 'Así te encuentran cuando alguien busca ropa, artesanías, arte…',
    mode: { kind: 'until', done: () => Boolean(val('#categoryId')), hint: 'Elegí una categoría' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'descripcion',
    path: /^\/panel\/productos\/nuevo$/,
    home: '/panel/productos/nuevo',
    target: '#description',
    title: 'Contá los detalles',
    body: 'Material, medidas, tallas, quién lo hace. Es opcional, pero los productos con buena descripción venden más.',
    mode: { kind: 'next' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'publicar',
    path: /^\/panel\/productos(\/nuevo)?$/,
    home: '/panel/productos/nuevo',
    target: '[data-tour="p-publicar"]',
    title: '¡A publicarlo!',
    body: 'Tocá «Publicar producto». Si falta algo, te lo marcamos en rojo.',
    mode: { kind: 'until', done: () => location.pathname === '/panel/productos', hint: 'Tocá «Publicar producto»' },
    skip: (p) => p.products > 0,
  },
  {
    id: 'qr',
    path: /^\/panel(\/productos|\/tienda)?$/,
    home: '/panel',
    target: '[data-tour="nav-qr"]',
    title: 'Tu QR para el local',
    body: 'Imprimilo o descargalo y pegalo en tu local, tus bolsas o tu tarjeta: quien lo escanee llega directo a tu tienda.',
    mode: { kind: 'next' },
  },
  {
    id: 'fin',
    path: /^\/panel(\/.*)?$/,
    home: '/panel',
    title: '¡Tu tienda está floreciendo! 🌸',
    body: 'Ya sabés dónde está todo. Seguí sumando productos: con 5 o más, tu tienda se ve completa y vende mejor.',
    mode: { kind: 'next' },
  },
]

/* ---------- estado (por tienda, en el celular) ---------- */

type Saved = { i: number; status: 'on' | 'off' | 'done' }
const keyFor = (storeId: string) => `f13_tour_v1_${storeId}`
function load(storeId: string): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(keyFor(storeId)) ?? 'null')
  } catch {
    return null
  }
}
function save(storeId: string, s: Saved) {
  try {
    localStorage.setItem(keyFor(storeId), JSON.stringify(s))
  } catch {}
}

/** Para el botón "Hacer el recorrido" del resumen. */
export function startTour() {
  window.dispatchEvent(new Event('f13-tour-start'))
}

const noopSubscribe = () => () => {}

export function Tour({ storeId, progress, autoStart }: { storeId: string; progress: TourProgress; autoStart: boolean }) {
  const path = usePathname()
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const [state, setState] = useState<Saved | null>(null)

  // Estado inicial: lo guardado, o arrancar solo si la tienda es nueva.
  useEffect(() => {
    const saved = load(storeId)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
    setState(saved ?? (autoStart ? { i: 0, status: 'on' } : { i: 0, status: 'off' }))
    const start = () => setState({ i: 0, status: 'on' })
    window.addEventListener('f13-tour-start', start)
    return () => window.removeEventListener('f13-tour-start', start)
  }, [storeId, autoStart])

  useEffect(() => {
    if (state) save(storeId, state)
    document.body.classList.toggle('touring', state?.status === 'on')
    return () => document.body.classList.remove('touring')
  }, [state, storeId])

  // Saltar pasos que ya están hechos.
  useEffect(() => {
    if (state?.status !== 'on') return
    let i = state.i
    while (i < STEPS.length - 1 && STEPS[i].skip?.(progress)) i++
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avance derivado del progreso real de la tienda
    if (i !== state.i) setState({ i, status: 'on' })
  }, [state, progress])

  // Avanza desde `from`: si el paso ya cambió (p. ej. lo saltó el progreso real), no avanza dos veces.
  const next = useCallback((from: number) => {
    setState((s) => {
      if (!s || s.i !== from) return s
      return s.i >= STEPS.length - 1 ? { i: s.i, status: 'done' } : { i: s.i + 1, status: 'on' }
    })
  }, [])
  const close = useCallback(() => setState((s) => (s ? { ...s, status: 'off' } : s)), [])

  if (!mounted || state?.status !== 'on') return null
  const step = STEPS[state.i]
  if (!step) return null
  if (!step.path.test(path)) return createPortal(<ResumePill href={step.home} onClose={close} />, document.body)
  return createPortal(<Spotlight key={step.id} step={step} index={state.i} onNext={() => next(state.i)} onClose={close} />, document.body)
}

/** Si se fue a otra página: botón para volver al paso. Espera un momento (mientras navega tras tocar un paso). */
function ResumePill({ href, onClose }: { href: string; onClose: () => void }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
      <div className="tour-pill">
        <Link href={href} className="btn btn-primary btn-sm">
          <Icon name="florece" size={16} /> Seguir el recorrido
        </Link>
        <button type="button" className="tour-pill__x" onClick={onClose} aria-label="Salir del recorrido">
          <Icon name="cerrar" size={14} />
        </button>
      </div>
  )
}

/* ---------- foco + tarjeta ---------- */

type Rect = { top: number; left: number; width: number; height: number }
const PAD = 8

function Spotlight({ step, index, onNext, onClose }: { step: Step; index: number; onNext: () => void; onClose: () => void }) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [missing, setMissing] = useState(false)
  const [ok, setOk] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(220)

  // Buscar el elemento, llevarlo a la vista y seguir su posición (scroll, teclado, cambios de tamaño).
  useEffect(() => {
    if (!step.target) return
    let raf = 0
    let scrolled = false
    const started = Date.now()
    const tick = () => {
      const el = $(step.target!)
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
          scrolled = true
        }
        const r = el.getBoundingClientRect()
        setRect((prev) =>
          prev && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5 && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        )
      } else if (Date.now() - started > 2500) setMissing(true)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step.target])

  // Pasos de "hacer": revisar hasta que esté hecho.
  useEffect(() => {
    if (step.mode.kind !== 'until') return
    const { done } = step.mode
    const t = setInterval(() => {
      if (done()) {
        clearInterval(t)
        setOk(true)
        setTimeout(onNext, 750)
      }
    }, 300)
    return () => clearInterval(t)
  }, [step, onNext])

  // Pasos de "tocar": avanzar cuando toca el elemento iluminado.
  useEffect(() => {
    if (step.mode.kind !== 'click' || !step.target) return
    const onClick = (e: MouseEvent) => {
      const el = $(step.target!)
      if (el && e.target instanceof Node && el.contains(e.target)) onNext()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [step, onNext])

  useLayoutEffect(() => {
    if (card.current) setCardH(card.current.offsetHeight)
  }, [step, ok, rect === null])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const hole = step.target && rect && !missing ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null
  const interactive = step.mode.kind !== 'next'

  // Tarjeta: debajo del elemento si cabe; si no, arriba; sin elemento, centrada.
  const W = Math.min(360, vw - 24)
  const bottomSafe = vh - (vw < 900 ? 96 : 16)
  let cardStyle: React.CSSProperties
  let arrow: 'up' | 'down' | null = null
  if (hole) {
    const left = Math.max(12, Math.min(vw - W - 12, hole.left + hole.width / 2 - W / 2))
    const below = hole.top + hole.height + 14
    if (below + cardH <= bottomSafe) {
      cardStyle = { top: below, left, width: W }
      arrow = 'up'
    } else if (hole.top - 14 - cardH >= 12) {
      cardStyle = { top: hole.top - 14 - cardH, left, width: W }
      arrow = 'down'
    } else {
      cardStyle = { top: Math.max(12, bottomSafe - cardH), left, width: W }
    }
  } else {
    cardStyle = { top: Math.max(16, (vh - cardH) / 2 - 20), left: (vw - W) / 2, width: W }
  }
  const arrowLeft = hole ? Math.max(20, Math.min(W - 20, hole.left + hole.width / 2 - (cardStyle.left as number))) : 0

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-t">
      {hole ? (
        <>
          <div className="tour__hole" style={hole} />
          {/* Bloqueadores alrededor del foco: fuera de él no se puede tocar nada. */}
          <div className="tour__block" style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <div className="tour__block" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className="tour__block" style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div className="tour__block" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          {!interactive && <div className="tour__block" style={hole} />}
        </>
      ) : (
        <div className="tour__dim" />
      )}

      <div ref={card} className={`tour__card${ok ? ' ok' : ''}`} style={cardStyle}>
        {arrow && <span className={`tour__arrow ${arrow}`} style={{ left: arrowLeft }} />}
        <div className="tour__top">
          <span className="tour__n">Paso {index + 1} de {STEPS.length}</span>
          <button type="button" className="tour__x" onClick={onClose} aria-label="Salir del recorrido">
            <Icon name="cerrar" size={16} />
          </button>
        </div>
        <h2 id="tour-t">{ok ? '¡Listo!' : step.title}</h2>
        {!ok && <p>{step.body}</p>}
        <div className="tour__dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <i key={s.id} className={i < index ? 'd' : i === index ? 'c' : undefined} />
          ))}
        </div>
        <div className="tour__act">
          {step.mode.kind === 'next' && (
            <>
              {index === 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                  Ahora no
                </button>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={onNext}>
                {index === 0 ? 'Empezar' : index === STEPS.length - 1 ? 'Terminar' : 'Siguiente'}
              </button>
            </>
          )}
          {step.mode.kind === 'click' && !ok && (
            <span className="tour__hint">
              <Icon name="flecha" size={16} /> Tocá el botón iluminado
            </span>
          )}
          {step.mode.kind === 'until' && !ok && (
            <span className="tour__hint">
              <span className="tour__pulse" /> {step.mode.hint}
            </span>
          )}
          {ok && (
            <span className="tour__hint ok">
              <Icon name="check" size={16} /> ¡Hecho!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
