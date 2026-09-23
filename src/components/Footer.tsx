import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container stack" style={{ ['--gap' as string]: '32px' }}>
        <div className="stack" style={{ ['--gap' as string]: '10px' }}>
          <Logo height={30} tone="light" />
          <p style={{ maxWidth: '44ch' }}>La Comuna 13, en línea. Del barrio, para todo el país.</p>
        </div>
        <div className="site-footer__grid">
          <div>
            <h2>Comprá</h2>
            <ul>
              <li><Link href="/buscar">Productos</Link></li>
              <li><Link href="/tiendas">Tiendas</Link></li>
              <li><Link href="/carrito">Carrito</Link></li>
            </ul>
          </div>
          <div>
            <h2>Vendé</h2>
            <ul>
              <li><Link href="/vende">Abrí tu tienda</Link></li>
              <li><Link href="/entrar">Entrar a mi tienda</Link></li>
              <li><Link href="/vende#fotos">Guía de fotos</Link></li>
            </ul>
          </div>
        </div>
        <p className="small">© {new Date().getFullYear()} Florece 13 · Hecho en la Comuna 13, Medellín.</p>
      </div>
    </footer>
  )
}
