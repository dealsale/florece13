import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { CartCount } from './cart'
import { Icon } from './Icon'
import { Logo } from './Logo'

export async function Header() {
  const user = await getCurrentUser()
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="Florece 13, inicio">
          <Logo height={30} />
        </Link>
        <nav className="site-header__nav" aria-label="Principal">
          <Link href="/buscar">Productos</Link>
          <Link href="/tiendas">Tiendas</Link>
          <Link href="/vende">Vendé en Florece 13</Link>
        </nav>
        <div className="site-header__actions">
          <Link href="/buscar" className="icon-btn" aria-label="Buscar">
            <Icon name="buscar" />
          </Link>
          <Link href="/carrito" className="icon-btn" aria-label="Carrito">
            <Icon name="carrito" />
            <CartCount />
          </Link>
          {user ? (
            <Link href={user.role === 'ADMIN' ? '/admin' : '/panel'} className="btn btn-outline btn-sm header-desktop-only">
              {user.role === 'ADMIN' ? 'Administración' : 'Mi tienda'}
            </Link>
          ) : (
            <Link href="/entrar" className="btn btn-outline btn-sm header-desktop-only">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
