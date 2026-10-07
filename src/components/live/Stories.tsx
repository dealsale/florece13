'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StoryGroup } from '@/lib/live-queries'
import { Avatar } from '../Avatar'
import { Icon } from '../Icon'

/**
 * Historias de la 13: fila de círculos y visor a pantalla completa.
 * Tocá a la derecha para avanzar, a la izquierda para volver; mantené presionado para pausar.
 */

const RINGS = ['#E5379B', '#2ECC71', '#FF8A00', '#17BEBB', '#6B5BD2', '#9C4A2F']
const PHOTO_MS = 5500
const SEEN_KEY = 'f13_historias_vistas'

function readSeen(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function StoriesBar({ groups, openSlug }: { groups: StoryGroup[]; openSlug?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [seen, setSeen] = useState<Record<string, true>>({})
  useEffect(() => {
    setSeen(readSeen()) // eslint-disable-line react-hooks/set-state-in-effect
    if (openSlug) {
      const i = groups.findIndex((g) => g.store.slug === openSlug)
      if (i >= 0) setOpen(i)
    }
  }, [groups, openSlug])
  const markSeen = useCallback((id: string) => {
    setSeen((s) => {
      if (s[id]) return s
      const next = { ...s, [id]: true as const }
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  if (groups.length === 0) return null
  // Primero las que tienen algo sin ver.
  const ordered = groups.map((g, i) => ({ g, i, unseen: g.items.some((it) => !seen[it.id]) })).sort((a, b) => Number(b.unseen) - Number(a.unseen))

  return (
    <>
      <div className="stories" role="list" aria-label="Historias de la 13">
        {ordered.map(({ g, i, unseen }) => (
          <button key={g.store.id} type="button" role="listitem" className={`story${unseen ? '' : ' seen'}`} style={{ ['--ring' as string]: RINGS[i % RINGS.length] }} onClick={() => setOpen(i)}>
            <span className="story__ring">
              <Avatar name={g.store.name} src={g.store.logo} size={62} />
            </span>
            <span className="story__n">{g.store.name}</span>
          </button>
        ))}
      </div>
      {open !== null && createPortal(<StoryViewer groups={groups} start={open} onSeen={markSeen} onClose={() => setOpen(null)} />, document.body)}
    </>
  )
}

function StoryViewer({ groups, start, onSeen, onClose }: { groups: StoryGroup[]; start: number; onSeen: (id: string) => void; onClose: () => void }) {
  const [gi, setGi] = useState(start)
  const [ii, setIi] = useState(() => Math.max(0, groups[start].items.findIndex((it) => !readSeen()[it.id])))
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const group = groups[gi]
  const item = group?.items[ii]

  const next = useCallback(() => {
    setProgress(0)
    if (ii < group.items.length - 1) setIi(ii + 1)
    else if (gi < groups.length - 1) {
      setGi(gi + 1)
      setIi(0)
    } else onClose()
  }, [gi, ii, group, groups.length, onClose])
  const prev = useCallback(() => {
    setProgress(0)
    if (ii > 0) setIi(ii - 1)
    else if (gi > 0) {
      setGi(gi - 1)
      setIi(groups[gi - 1].items.length - 1)
    }
  }, [gi, ii, groups])

  useEffect(() => {
    if (item) onSeen(item.id)
  }, [item, onSeen])

  // Avance automático: fotos 5,5 s; videos lo que duren.
  useEffect(() => {
    if (!item || paused) return
    if (item.mediaType === 'video') {
      const v = video.current
      if (!v) return
      v.play().catch(() => {})
      const t = setInterval(() => v.duration && setProgress(v.currentTime / v.duration), 100)
      return () => {
        clearInterval(t)
        v.pause()
      }
    }
    const started = Date.now() - progress * PHOTO_MS
    const t = setInterval(() => {
      const p = (Date.now() - started) / PHOTO_MS
      if (p >= 1) next()
      else setProgress(p)
    }, 50)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, paused, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [next, prev, onClose])

  if (!item) return null
  const ago = Math.max(1, Math.round((Date.now() - new Date(item.createdAt).getTime()) / 3600_000))

  return (
    <div className="sv" role="dialog" aria-modal="true" aria-label={`Historia de ${group.store.name}`}>
      <div className="sv__frame">
        <div className="sv__bars">
          {group.items.map((it, k) => (
            <span key={it.id}><i style={{ width: `${k < ii ? 100 : k === ii ? progress * 100 : 0}%` }} /></span>
          ))}
        </div>
        <div className="sv__head">
          <Link href={`/t/${group.store.slug}`} className="sv__store" onClick={onClose}>
            <Avatar name={group.store.name} src={group.store.logo} size={34} />
            <b>{group.store.name}</b>
            <small>hace {ago} h</small>
          </Link>
          <button type="button" className="sv__x" onClick={onClose} aria-label="Cerrar">
            <Icon name="cerrar" size={22} />
          </button>
        </div>
        {item.mediaType === 'video' ? (
          <video key={item.id} ref={video} className="sv__media" src={item.mediaUrl} playsInline autoPlay muted={false} onEnded={next} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.id} className="sv__media" src={item.mediaUrl} alt={item.caption} />
        )}
        {item.caption && <p className="sv__cap">{item.caption}</p>}
        <button type="button" className="sv__nav prev" aria-label="Anterior" onClick={prev} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        <button type="button" className="sv__nav next" aria-label="Siguiente" onClick={next} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        <Link href={`/t/${group.store.slug}`} className="btn btn-light sv__cta" onClick={onClose}>
          Ver la tienda <Icon name="flecha" size={16} />
        </Link>
      </div>
    </div>
  )
}
