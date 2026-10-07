'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CartCount } from './cart'
import { Icon } from './Icon'

/** Barra de abajo (celular): Mi 13 · Mapa · Explorar · Carrito · Cuenta. */
export function TabBar({ account }: { account: 'none' | 'customer' | 'merchant' | 'admin' }) {
  const path = usePathname()
  const me =
    account === 'merchant'
      ? { href: '/panel', label: 'Mi tienda', icon: 'tienda' }
      : account === 'admin'
        ? { href: '/admin', label: 'Admin', icon: 'escudo' }
        : account === 'customer'
          ? { href: '/cuenta', label: 'Mi cuenta', icon: 'usuario' }
          : { href: '/entrar', label: 'Entrar', icon: 'usuario' }
  const tabs = [
    { href: '/', label: 'Mi 13', icon: 'inicio', active: path === '/' },
    { href: '/mapa', label: 'Mapa', icon: 'mapa', active: path.startsWith('/mapa') },
    { href: '/buscar', label: 'Explorar', icon: 'buscar', active: ['/buscar', '/tiendas', '/t/', '/p/', '/u/', '/ofertas', '/eventos', '/empleo'].some((p) => path.startsWith(p)) },
    { href: '/carrito', label: 'Carrito', icon: 'carrito', active: path.startsWith('/carrito') || path.startsWith('/pedido') },
    { ...me, active: ['/panel', '/vende', '/admin', '/entrar', '/registro', '/cuenta'].some((p) => path.startsWith(p)) },
  ]
  return (
    <nav className="tabs" aria-label="Navegación">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.active ? 'page' : undefined}>
          <Icon name={t.icon} size={22} />
          {t.label}
          {t.icon === 'carrito' && <CartCount />}
        </Link>
      ))}
    </nav>
  )
}
