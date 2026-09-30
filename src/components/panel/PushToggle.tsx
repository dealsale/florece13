'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { pushPublicKey, removePushSubscription, savePushSubscription, sendTestNotification } from '@/lib/actions/notifications'
import { Icon } from '../Icon'
import { useInstall } from '../InstallApp'

/**
 * Activar / desactivar las notificaciones push en ESTE dispositivo.
 * iPhone/iPad: Apple solo permite push con la app instalada en la pantalla de inicio (iOS 16.4+).
 */

type State = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on'

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

export function usePush() {
  const { env, install } = useInstall()
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!env) return
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!supported) return setState(env.platform === 'ios' && !env.standalone ? 'ios-install' : 'unsupported')
    if (Notification.permission === 'denied') return setState('denied')
    const reg = await registration()
    const sub = await reg.pushManager.getSubscription()
    if (sub && Notification.permission === 'granted') {
      // Se vuelve a guardar por si cambió de cuenta o el servidor la había descartado.
      savePushSubscription(sub.toJSON()).catch(() => {})
      return setState('on')
    }
    setState('off')
  }, [env])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado del navegador, solo existe en el cliente
    refresh()
  }, [refresh])

  const enable = useCallback(async () => {
    setError('')
    if (state === 'ios-install') return install()
    setBusy(true)
    try {
      // Pedir el permiso primero, dentro del toque (iOS lo exige).
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'denied' : 'off')
        return
      }
      const [reg, key] = await Promise.all([registration().then(() => navigator.serviceWorker.ready), pushPublicKey()])
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) }))
      const res = await savePushSubscription(sub.toJSON())
      if (!res.ok) throw new Error('save')
      setState('on')
    } catch {
      setError('No pudimos activarlas. Intentá de nuevo.')
    } finally {
      setBusy(false)
    }
  }, [state, install])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      const sub = await (await registration()).pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setState('off')
    } finally {
      setBusy(false)
    }
  }, [])

  return { state, busy, error, enable, disable }
}

/** Tarjeta de ajustes (en Avisos y en Administración). */
export function PushSettings() {
  const { state, busy, error, enable, disable } = usePush()
  const [testing, startTest] = useTransition()
  const [sent, setSent] = useState(false)

  return (
    <section className={`push-card ${state === 'on' ? 'is-on' : ''}`}>
      <div className="push-card__ic" aria-hidden="true">
        <Icon name="campana" size={24} />
      </div>
      <div className="push-card__t">
        <h2>Notificaciones en este dispositivo</h2>
        {state === 'loading' && <p>Revisando…</p>}
        {state === 'on' && <p>Activadas. Te avisamos al instante cuando llegue un pedido, aunque tengas la app cerrada.</p>}
        {state === 'off' && <p>Activalas para enterarte al instante de cada pedido nuevo, aunque tengas la app cerrada.</p>}
        {state === 'ios-install' && <p>En iPhone, Apple solo permite notificaciones con Florece 13 instalada en la pantalla de inicio. Instalala y activalas desde ahí.</p>}
        {state === 'denied' && <p>Las bloqueaste en este dispositivo. Para activarlas: ajustes del navegador (o del teléfono) → Notificaciones → Florece 13 → Permitir. Después recargá esta página.</p>}
        {state === 'unsupported' && <p>Este navegador no permite notificaciones. Probá con Chrome, Edge, Firefox o Safari actualizado, o instalá la app.</p>}
        {error && <p className="push-card__err">{error}</p>}
      </div>
      <div className="push-card__act">
        {(state === 'off' || state === 'ios-install') && (
          <button type="button" className="btn btn-primary btn-sm" onClick={enable} disabled={busy}>
            {state === 'ios-install' ? 'Instalar la app' : busy ? 'Activando…' : 'Activar'}
          </button>
        )}
        {state === 'on' && (
          <>
            <button
              type="button"
              className="btn btn-light btn-sm"
              disabled={testing}
              onClick={() =>
                startTest(async () => {
                  await sendTestNotification()
                  setSent(true)
                })
              }
            >
              {testing ? 'Enviando…' : sent ? '¡Enviada!' : 'Enviar prueba'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={disable} disabled={busy}>
              Desactivar
            </button>
          </>
        )}
      </div>
    </section>
  )
}

const PROMPT_KEY = 'f13_push_prompt_cerrado'

/** Invitación suave al entrar al panel (el permiso del navegador solo se pide al tocar "Activar"). */
export function PushPrompt() {
  const { state, busy, error, enable } = usePush()
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    try {
      const t = Number(localStorage.getItem(PROMPT_KEY))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
      setHidden(t > 0 && Date.now() - t < 7 * 864e5)
    } catch {
      setHidden(false)
    }
  }, [])

  if (hidden || !['off', 'ios-install'].includes(state)) return null
  const close = () => {
    try {
      localStorage.setItem(PROMPT_KEY, String(Date.now()))
    } catch {}
    setHidden(true)
  }
  return (
    <div className="push-prompt rise" role="region" aria-label="Activar notificaciones">
      <span className="push-prompt__ic" aria-hidden="true">
        <Icon name="campana" size={22} />
      </span>
      <div className="push-prompt__t">
        <b>¿Te avisamos cuando llegue un pedido?</b>
        <span>{state === 'ios-install' ? 'En iPhone primero instalá la app; después activás los avisos.' : error || 'Te llega una notificación al instante, aunque tengas la app cerrada.'}</span>
      </div>
      <div className="push-prompt__act">
        <button type="button" className="btn btn-primary btn-sm" onClick={enable} disabled={busy}>
          {state === 'ios-install' ? 'Instalar' : busy ? 'Activando…' : 'Activar'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={close}>
          Ahora no
        </button>
      </div>
    </div>
  )
}
