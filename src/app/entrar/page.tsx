import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } }

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '' } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'CUSTOMER' ? '/cuenta' : user.role === 'ADMIN' ? '/admin' : '/panel')
  return (
    <div className="auth">
      <div className="stack rise" style={{ ['--gap' as string]: '8px' }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 22 }}>¡qué bueno verte!</span>
        <h1 className="h1">Entrá a tu cuenta</h1>
        <p className="lede">Para negocios y para compradores con cuenta. Para comprar no hace falta.</p>
      </div>
      <LoginForm next={next} />
      <p className="small">
        ¿No tenés cuenta? <Link href="/registro?tipo=cliente" style={{ fontWeight: 700, color: 'var(--verde)' }}>Creá una para comprar</Link> o{' '}
        <Link href="/registro" style={{ fontWeight: 700, color: 'var(--verde)' }}>abrí tu tienda</Link>.
      </p>
    </div>
  )
}
