import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false } }

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ tipo?: string; next?: string }> }) {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'CUSTOMER' ? '/cuenta' : '/panel')
  const { tipo, next } = await searchParams
  const cliente = tipo === 'cliente'
  const q = (t: string) => `/registro?tipo=${t}${next ? `&next=${encodeURIComponent(next)}` : ''}`
  return (
    <div className="auth">
      <div className="seg-mini" role="tablist" style={{ alignSelf: 'flex-start' }}>
        <Link href={q('cliente')} className={cliente ? 'on' : ''} role="tab" aria-selected={cliente}>Quiero comprar</Link>
        <Link href={q('tienda')} className={!cliente ? 'on' : ''} role="tab" aria-selected={!cliente}>Quiero vender</Link>
      </div>
      <div className="stack rise" style={{ ['--gap' as string]: '8px' }}>
        {cliente ? (
          <>
            <h1 className="h1">Tu cuenta en la 13.</h1>
            <p className="lede">Es opcional: podés comprar sin cuenta. Con ella ves tus pedidos, tus datos se completan solos y llevás la cuenta de tu impacto.</p>
          </>
        ) : (
          <>
            <span className="chip chip-florece" style={{ alignSelf: 'flex-start' }}>Paso 1 de 2</span>
            <h1 className="h1">Tu negocio también florece.</h1>
            <p className="lede">Creá tu cuenta y en el siguiente paso armamos tu tienda.</p>
          </>
        )}
      </div>
      <RegisterForm tipo={cliente ? 'cliente' : 'tienda'} next={next} />
      <p className="small">¿Ya tenés cuenta? <Link href={`/entrar${next ? `?next=${encodeURIComponent(next)}` : ''}`} style={{ fontWeight: 700, color: 'var(--verde)' }}>Entrá aquí</Link></p>
    </div>
  )
}
