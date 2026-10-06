'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import { Icon } from '../Icon'

const LINKS = [
  { href: '/panel', label: 'Resumen', icon: 'inicio', exact: true, tour: 'nav-resumen' },
  { href: '/panel/pedidos', label: 'Pedidos', icon: 'pedidos', tour: 'nav-pedidos' },
  { href: '/panel/avisos', label: 'Avisos', icon: 'campana', tour: 'nav-avisos' },
  { href: '/panel/productos', label: 'Catálogo', icon: 'florece', tour: 'nav-productos' },
  { href: '/panel/tienda', label: 'Mi tienda', icon: 'tienda', tour: 'nav-tienda' },
  { href: '/panel/qr', label: 'QR y sticker', icon: 'qr', tour: 'nav-qr' },
]

export function PanelNav({ storeSlug, newOrders, unread = 0 }: { storeSlug: string; newOrders: number; unread?: number }) {
  const path = usePathname()
  return (
    <nav className="pnav" aria-label="Panel de la tienda">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} data-tour={l.tour} aria-current={(l.exact ? path === l.href : path.startsWith(l.href)) ? 'page' : undefined}>
          <Icon name={l.icon} size={20} /> {l.label}
          {l.href === '/panel/pedidos' && newOrders > 0 && <span className="chip st-NUEVO" style={{ padding: '2px 8px' }}>{newOrders}</span>}
          {l.href === '/panel/avisos' && unread > 0 && <span className="chip chip-florece" style={{ padding: '2px 8px' }}>{unread}</span>}
        </Link>
      ))}
      <Link href={`/t/${storeSlug}`}><Icon name="ojo" size={20} /> Ver mi tienda</Link>
      <form action={logout} style={{ display: 'contents' }}>
        <button type="submit" className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontWeight: 600, color: 'var(--tinta-2)', flexShrink: 0 }}>
          <Icon name="salir" size={20} /> Salir
        </button>
      </form>
    </nav>
  )
}
