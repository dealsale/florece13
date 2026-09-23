import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function EmptyState({
  title,
  text,
  icon = 'florece',
  children,
}: {
  title: string
  text?: string
  icon?: string
  children?: ReactNode
}) {
  return (
    <div className="empty">
      <span style={{ color: 'var(--verde-pedido)' }}><Icon name={icon} size={40} /></span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {children}
    </div>
  )
}
