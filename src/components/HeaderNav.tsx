'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function HeaderNav({ admin }: { admin: boolean }) {
  const path = usePathname()
  const links = [
    ['/buscar', 'Productos'],
    ['/tiendas', 'Tiendas'],
    ['/vende', 'Vendé'],
    ...(admin ? [['/admin', 'Administración']] : []),
  ]
  return (
    <nav aria-label="Principal">
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  )
}
