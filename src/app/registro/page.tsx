import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Abrí tu tienda' }

export default async function RegistroPage() {
  if (await getCurrentUser()) redirect('/panel')
  return (
    <div className="auth">
      <div className="stack rise" style={{ ['--gap' as string]: '8px' }}>
        <span className="chip chip-florece" style={{ alignSelf: 'flex-start' }}>Paso 1 de 2</span>
        <h1 className="h1">Tu negocio también florece.</h1>
        <p className="lede">Creá tu cuenta y en el siguiente paso armamos tu tienda.</p>
      </div>
      <RegisterForm />
      <p className="small">¿Ya tenés cuenta? <Link href="/entrar" style={{ fontWeight: 700, color: 'var(--verde)' }}>Entrá aquí</Link></p>
    </div>
  )
}
