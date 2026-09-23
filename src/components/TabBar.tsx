'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CartCount } from './cart'
import { Icon } from './Icon'

export function TabBar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname()
  const tabs = [
    { href: '/', label: 'Inicio', icon: 'inicio', active: path === '/' },
    { href: '/buscar', label: 'Explorar', icon: 'buscar', active: path.startsWith('/buscar') || path.startsWith('/tiendas') },
    { href: '/carrito', label: 'Carrito', icon: 'carrito', active: path.startsWith('/carrito') || path.startsWith('/pedido') },
    {
      href: loggedIn ? '/panel' : '/vende',
      label: loggedIn ? 'Mi tienda' : 'Vender',
      icon: 'tienda',
      active: path.startsWith('/panel') || path.startsWith('/vende') || path.startsWith('/admin'),
    },
  ]
  return (
    <nav className="tabbar" aria-label="Navegación">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.active ? 'page' : undefined}>
          <Icon name={t.icon} size={24} />
          {t.label}
          {t.icon === 'carrito' && <CartCount />}
        </Link>
      ))}
    </nav>
  )
}
