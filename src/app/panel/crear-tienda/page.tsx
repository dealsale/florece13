import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getStoreForUser, requireUser } from '@/lib/auth'
import { SECTORES } from '@/lib/orders'
import { getCategories } from '@/lib/queries'
import { CreateStoreForm } from './CreateStoreForm'

export const metadata: Metadata = { title: 'Creá tu tienda' }

export default async function CrearTiendaPage() {
  const user = await requireUser('/panel/crear-tienda')
  if (await getStoreForUser(user.id)) redirect('/panel')
  const categories = await getCategories()
  return (
    <div className="auth-wrap stack" style={{ maxWidth: 560, ['--gap' as string]: '20px' }}>
      <div>
        <span className="chip chip-florece">Paso 2 de 2</span>
        <h1 className="title" style={{ marginTop: 12 }}>Armemos tu tienda, {user.name.split(' ')[0]}.</h1>
        <p className="muted" style={{ marginTop: 6 }}>Lo básico para empezar. Foto, portada e historia las agregás después.</p>
      </div>
      <CreateStoreForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} sectores={SECTORES} />
    </div>
  )
}
