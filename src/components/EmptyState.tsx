import type { ReactNode } from 'react'
import { flower, stairs } from '@/lib/art'
import { Svg } from './Svg'

export function EmptyState({ title, text, children, motif = 'flor' }: { title: string; text?: string; children?: ReactNode; motif?: 'flor' | 'escalera' }) {
  const art =
    motif === 'flor'
      ? `<svg viewBox="-60 -60 120 120" width="120" height="120" aria-hidden="true"><circle r="56" fill="#DDF6E7"/><path d="M0 8 C 3 25, -3 38, 0 50" stroke="#128C4B" stroke-width="5" fill="none"/><g transform="scale(1.7)">${flower('bloom')}</g></svg>`
      : stairs('#FFEBD2', 5, 120, 120)
  return (
    <div className="empty rise">
      <Svg html={art} className="empty__art" />
      <p className="empty__t">{title}</p>
      {text && <p className="empty__p">{text}</p>}
      {children}
    </div>
  )
}
