'use client'

import { useState } from 'react'
import { setNearDeals } from '@/lib/actions/device'
import { Icon } from '../Icon'
import { useInstall } from '../InstallApp'
import { useMyLocation } from '../location'
import { enableDevicePush, pushSupported } from './devicePush'
import { setDeviceState, useDevice } from './useDevice'

/** 🔔 Avisarme de ofertas cerca: ubicación + permiso de notificaciones, sin cuenta. */
export function NearDealsToggle() {
  const { id, state } = useDevice()
  const { request } = useMyLocation()
  const { env, install } = useInstall()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const on = Boolean(state?.nearDeals)

  const toggle = async () => {
    if (!id) return
    setMsg('')
    if (on) {
      await setNearDeals(id, false)
      setDeviceState({ nearDeals: false })
      return
    }
    if (!pushSupported()) {
      if (env?.platform === 'ios' && !env.standalone) {
        setMsg('En iPhone, primero instalá Florece 13 en tu pantalla de inicio.')
        install()
      } else setMsg('Este navegador no permite notificaciones.')
      return
    }
    setBusy(true)
    const push = await enableDevicePush(id)
    if (push !== 'ok') {
      setBusy(false)
      return setMsg(push === 'denied' ? 'Bloqueaste las notificaciones. Activalas en los ajustes del navegador.' : 'No pudimos activarlas. Intentá de nuevo.')
    }
    const loc = await request()
    if (!loc) {
      setBusy(false)
      return setMsg('Necesitamos tu ubicación para saber qué ofertas te quedan cerca.')
    }
    await setNearDeals(id, true, loc.lat, loc.lng, 1500)
    setDeviceState({ nearDeals: true, push: true })
    setBusy(false)
  }

  return (
    <div className="near-toggle">
      <button type="button" className={`btn ${on ? 'btn-light' : 'btn-primary'}`} onClick={toggle} disabled={busy || !id}>
        <Icon name="campana" size={18} /> {busy ? 'Activando…' : on ? 'Avisos de ofertas cerca: activados' : 'Avisarme de ofertas cerca'}
      </button>
      {msg ? <span className="small" style={{ color: 'var(--error)' }}>{msg}</span> : <span className="small muted">{on ? 'Te avisamos de cada Flash a menos de 1,5 km. Tocá para apagarlo.' : 'Te llega una notificación cuando salga un Flash cerca de vos.'}</span>}
    </div>
  )
}
