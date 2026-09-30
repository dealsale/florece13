'use client'

import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Instalar Florece 13 como app (PWA).
 * - Android / Chrome / Edge: el navegador dispara `beforeinstallprompt` y mostramos su ventana nativa.
 * - iOS (Safari y demás): no hay ventana nativa; se instala con Compartir → "Agregar a pantalla de inicio",
 *   así que mostramos esos pasos.
 * - Navegadores dentro de Instagram, Facebook, TikTok…: no permiten instalar; pedimos abrir en el navegador.
 */

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
type Platform = 'ios' | 'android' | 'desktop'
type Env = { platform: Platform; inApp: boolean; ipad: boolean; standalone: boolean }

declare global {
  interface Window {
    __f13Install?: InstallPromptEvent | null
  }
}

/** Script en <head>: guarda el evento aunque llegue antes de que React cargue. */
export const INSTALL_EARLY_SCRIPT = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__f13Install=e;window.dispatchEvent(new Event('f13-install'))});window.addEventListener('appinstalled',function(){window.__f13Install=null;window.dispatchEvent(new Event('f13-install'))});`

const subscribe = (cb: () => void) => {
  window.addEventListener('f13-install', cb)
  return () => window.removeEventListener('f13-install', cb)
}
const usePromptEvent = () =>
  useSyncExternalStore(
    subscribe,
    () => window.__f13Install ?? null,
    () => null,
  )

function detect(): Env {
  const ua = navigator.userAgent
  const ipad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const ios = ipad || /iPhone|iPod/.test(ua)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return {
    platform: ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop',
    inApp: /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Snapchat|Twitter|LinkedInApp|GSA\//i.test(ua),
    ipad,
    standalone,
  }
}

type Ctx = {
  env: Env | null
  canPrompt: boolean
  /** Ventana nativa si existe; si no, los pasos. */
  install: () => void
}
const InstallCtx = createContext<Ctx>({ env: null, canPrompt: false, install: () => {} })
export const useInstall = () => useContext(InstallCtx)

export function InstallProvider({ children }: { children: ReactNode }) {
  const [env, setEnv] = useState<Env | null>(null)
  const [guide, setGuide] = useState(false)
  const promptEvent = usePromptEvent()

  useEffect(() => {
    const e = detect()
    setEnv(e)
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setEnv(detect())
    mq.addEventListener('change', onChange)
    window.addEventListener('f13-install', onChange)
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('f13-install', onChange)
    }
  }, [])

  const install = useCallback(async () => {
    const ev = window.__f13Install
    if (ev && !env?.inApp) {
      await ev.prompt()
      const { outcome } = await ev.userChoice
      // El evento sirve una sola vez.
      window.__f13Install = null
      window.dispatchEvent(new Event('f13-install'))
      if (outcome === 'accepted') remember()
      return
    }
    setGuide(true)
  }, [env])

  return (
    <InstallCtx.Provider value={{ env, canPrompt: Boolean(promptEvent), install }}>
      {children}
      {guide && env && <InstallGuide env={env} onClose={() => setGuide(false)} />}
    </InstallCtx.Provider>
  )
}

/* ---------- aviso flotante ---------- */

const DISMISS_KEY = 'f13_instalar_cerrado'
const DISMISS_DAYS = 14
function remember() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {}
}
function dismissedRecently() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY))
    return t > 0 && Date.now() - t < DISMISS_DAYS * 864e5
  } catch {
    return false
  }
}

/** En formularios y en el pago no interrumpimos. */
const QUIET = ['/carrito/', '/pedido/', '/entrar', '/registro', '/panel/productos/', '/panel/crear-tienda', '/offline']

export function InstallBanner() {
  const { env, canPrompt, install } = useInstall()
  const path = usePathname()
  const [show, setShow] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const eligible = Boolean(env && !env.standalone && (env.platform !== 'desktop' || canPrompt))
  useEffect(() => {
    if (!eligible || dismissedRecently()) return
    const t = setTimeout(() => setShow(true), 3500)
    return () => clearTimeout(t)
  }, [eligible])

  if (!show || !env || env.standalone || QUIET.some((p) => path.startsWith(p))) return null

  const close = () => {
    remember()
    setLeaving(true)
    setTimeout(() => setShow(false), 260)
  }
  const device = env.platform === 'ios' ? (env.ipad ? 'iPad' : 'iPhone') : env.platform === 'android' ? 'celular' : 'computador'

  return (
    <div className={`inst${leaving ? ' out' : ''}`} role="region" aria-label="Instalar la app">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/apple-touch-icon.png" alt="" width={46} height={46} className="inst__ic" />
      <div className="inst__t">
        <b>Tené Florece 13 en tu {device}</b>
        <span>A un toque, a pantalla completa y sin tienda de apps.</span>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => {
          install()
          if (canPrompt) setShow(false)
        }}
      >
        Instalar
      </button>
      <button type="button" className="inst__x" aria-label="No por ahora" onClick={close}>
        <Icon name="cerrar" size={16} />
      </button>
    </div>
  )
}

/* ---------- bloque del pie de página ---------- */

export function InstallFooter() {
  const { env, install } = useInstall()
  if (env?.standalone) return null
  return (
    <div className="inst-foot">
      <div className="inst-foot__art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/apple-touch-icon.png" alt="" width={64} height={64} />
      </div>
      <div className="inst-foot__t">
        <h2>Llevá Florece 13 en tu celular</h2>
        <p>Instalala gratis desde el navegador, sin tienda de apps. Funciona en iPhone y Android.</p>
      </div>
      <button type="button" className="btn btn-light" onClick={install}>
        <Icon name="celular" size={18} /> Instalar la app
      </button>
    </div>
  )
}

/* ---------- guía paso a paso ---------- */

function Step({ n, icon, children, hint }: { n: number; icon?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <li className="inst-step" style={{ ['--i' as string]: n }}>
      <span className="inst-step__n">{n}</span>
      <div>
        <p>{children}</p>
        {hint && <small>{hint}</small>}
      </div>
      {icon && (
        <span className="inst-step__ic" aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
      )}
    </li>
  )
}

function InstallGuide({ env, onClose }: { env: Env; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (!d.open) d.showModal()
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    d.addEventListener('cancel', onCancel)
    return () => d.removeEventListener('cancel', onCancel)
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
    } catch {}
  }

  const ios = env.platform === 'ios'
  const browser = ios ? 'Safari' : 'Chrome'
  const device = ios ? (env.ipad ? 'iPad' : 'iPhone') : env.platform === 'android' ? 'celular' : 'computador'
  let n = 0

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="inst-title" onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet__in">
        <span className="sheet__grip" aria-hidden="true" />
        <button type="button" className="sheet__x" aria-label="Cerrar" onClick={onClose}>
          <Icon name="cerrar" size={18} />
        </button>
        <div className="inst-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/apple-touch-icon.png" alt="" width={56} height={56} />
          <div>
            <span className="tag">¡a un toque!</span>
            <h2 id="inst-title">Instalá Florece 13 en tu {device}</h2>
          </div>
        </div>

        <ol className="inst-steps">
          {env.inApp && (
            <Step
              n={++n}
              icon="menuPuntos"
              hint={
                <>
                  Estás dentro de otra app (Instagram, Facebook…) y desde ahí no se puede instalar.{' '}
                  <button type="button" className="linkish" onClick={copy}>
                    {copied ? '¡Link copiado!' : 'Copiar el link'}
                  </button>{' '}
                  y pegalo en {browser}.
                </>
              }
            >
              Tocá <b>···</b> y elegí <b>Abrir en {ios ? 'Safari' : 'el navegador'}</b>
            </Step>
          )}

          {ios && (
            <>
              <Step n={++n} icon="compartirIos" hint={<>En Safari está en la barra de abajo{env.ipad ? ' (en iPad, arriba a la derecha)' : ''}; si no lo ves, tocá <b>···</b> primero. En Chrome está arriba, junto a la dirección.</>}>
                Tocá el botón <b>Compartir</b>
              </Step>
              <Step n={++n} icon="agregar" hint="Si no aparece, deslizá la lista hacia arriba o tocá “Ver más”.">
                Elegí <b>Agregar a pantalla de inicio</b>
              </Step>
              <Step n={++n} icon="check" hint="Dejá activado “Abrir como app web” si te lo pregunta.">
                Tocá <b>Agregar</b>. ¡Listo!
              </Step>
            </>
          )}

          {env.platform === 'android' && (
            <>
              <Step n={++n} icon="menuPuntos" hint="Arriba a la derecha en Chrome; abajo en Samsung Internet.">
                Abrí el menú <b>⋮</b> del navegador
              </Step>
              <Step n={++n} icon="agregar">
                Tocá <b>Instalar app</b> o <b>Agregar a pantalla principal</b>
              </Step>
              <Step n={++n} icon="check">
                Confirmá con <b>Instalar</b>. ¡Listo!
              </Step>
            </>
          )}

          {env.platform === 'desktop' && (
            <>
              <Step n={++n} icon="agregar" hint="En Chrome o Edge: el ícono de instalar al final de la barra de direcciones, o el menú ⋮ → Transmitir, guardar y compartir → Instalar.">
                Buscá <b>Instalar Florece 13</b> en tu navegador
              </Step>
              <Step n={++n} icon="compartirIos" hint="En Safari para Mac: menú Archivo → Agregar al Dock.">
                ¿Usás Safari? Agregala al <b>Dock</b>
              </Step>
              <Step n={++n} icon="celular" hint="Donde mejor se disfruta es en el celular: abrí florece13.shop desde ahí.">
                O instalala en tu <b>celular</b>
              </Step>
            </>
          )}
        </ol>

        <p className="inst-note">
          Florece 13 aparece con los demás apps, abre a pantalla completa y se actualiza sola. Sin descargas pesadas ni tienda de apps.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Entendido
        </button>
      </div>
    </dialog>
  )
}
