import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Entrar' }

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '' } = await searchParams
  if (await getCurrentUser()) redirect('/panel')
  return (
    <div className="auth">
      <div className="stack rise" style={{ ['--gap' as string]: '8px' }}>
        <span className="tag" style={{ color: 'var(--fucsia-t)', fontSize: 22 }}>¡qué bueno verte!</span>
        <h1 className="h1">Entrá a tu tienda</h1>
        <p className="lede">Para comerciantes de Florece 13.</p>
      </div>
      <LoginForm next={next} />
      <p className="small">¿Todavía no tenés tienda? <Link href="/registro" style={{ fontWeight: 700, color: 'var(--verde)' }}>Abrila aquí</Link></p>
    </div>
  )
}
