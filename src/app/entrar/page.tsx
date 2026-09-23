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
    <div className="auth-wrap stack" style={{ ['--gap' as string]: '20px' }}>
      <div>
        <h1 className="title">Entrá a tu tienda</h1>
        <p className="muted" style={{ marginTop: 6 }}>Para comerciantes de Florece 13.</p>
      </div>
      <LoginForm next={next} />
      <p className="small">
        ¿Todavía no tenés tienda? <Link href="/registro" style={{ fontWeight: 700 }}>Abrila aquí</Link>
      </p>
    </div>
  )
}
