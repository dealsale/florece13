'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import { Icon } from '../Icon'

const LINKS = [
  { href: '/panel', label: 'Resumen', icon: 'inicio', exact: true },
  { href: '/panel/pedidos', label: 'Pedidos', icon: 'pedidos' },
  { href: '/panel/productos', label: 'Productos', icon: 'florece' },
  { href: '/panel/tienda', label: 'Mi tienda', icon: 'tienda' },
  { href: '/panel/qr', label: 'QR y sticker', icon: 'qr' },
]

export function PanelNav({ storeSlug }: { storeSlug: string }) {
  const path = usePathname()
  return (
    <nav className="panel-nav" aria-label="Panel de la tienda">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={(l.exact ? path === l.href : path.startsWith(l.href)) ? 'page' : undefined}>
          <Icon name={l.icon} size={20} /> {l.label}
        </Link>
      ))}
      <Link href={`/t/${storeSlug}`}><Icon name="ojo" size={20} /> Ver mi tienda</Link>
      <form action={logout} style={{ display: 'contents' }}>
        <button type="submit" className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontWeight: 600, color: 'var(--texto-2)', flexShrink: 0 }}>
          <Icon name="salir" size={20} /> Salir
        </button>
      </form>
    </nav>
  )
}
