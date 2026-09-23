import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Abrí tu tienda' }

export default async function RegistroPage() {
  if (await getCurrentUser()) redirect('/panel')
  return (
    <div className="auth-wrap stack" style={{ ['--gap' as string]: '20px' }}>
      <div>
        <span className="chip chip-florece">Paso 1 de 2</span>
        <h1 className="title" style={{ marginTop: 12 }}>Tu negocio también florece.</h1>
        <p className="muted" style={{ marginTop: 6 }}>Creá tu cuenta y en el siguiente paso armamos tu tienda.</p>
      </div>
      <RegisterForm />
      <p className="small">
        ¿Ya tenés cuenta? <Link href="/entrar" style={{ fontWeight: 700 }}>Entrá aquí</Link>
      </p>
    </div>
  )
}
