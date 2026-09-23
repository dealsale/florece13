import Link from 'next/link'
import { getCurrentUser, getStoreForUser } from '@/lib/auth'
import { CartCount } from './cart'
import { HeaderNav } from './HeaderNav'
import { Icon } from './Icon'
import { Logo } from './Logo'

export async function Header() {
  const user = await getCurrentUser()
  const store = user ? await getStoreForUser(user.id) : null
  return (
    <header className="top">
      <div className="wrap top__in">
        <Link href="/" aria-label="Florece 13, inicio"><Logo height={30} /></Link>
        <HeaderNav admin={user?.role === 'ADMIN'} />
        <div className="top__act">
          <Link href="/buscar" className="icon-btn" aria-label="Buscar"><Icon name="buscar" /></Link>
          <Link href="/carrito" className="icon-btn" aria-label="Carrito"><Icon name="carrito" /><CartCount /></Link>
          {user?.role === 'ADMIN' ? (
            <Link href="/admin" className="btn btn-sm btn-outline desk">Administración</Link>
          ) : store ? (
            <Link href="/panel" className="btn btn-sm btn-outline desk">Mi tienda</Link>
          ) : user ? (
            <Link href="/panel/crear-tienda" className="btn btn-sm btn-primary desk">Crear mi tienda</Link>
          ) : (
            <>
              <Link href="/entrar" className="btn btn-sm btn-ghost desk">Entrar</Link>
              <Link href="/vende" className="btn btn-sm btn-primary desk">Vender</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
