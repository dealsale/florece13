import type { Metadata } from 'next'
import { StoreSettingsForm } from '@/components/panel/StoreSettingsForm'
import { requireMerchant } from '@/lib/auth'
import { SECTORES } from '@/lib/orders'
import { getCategories } from '@/lib/queries'

export const metadata: Metadata = { title: 'Mi tienda' }

export default async function TiendaSettingsPage() {
  const { store } = await requireMerchant('/panel/tienda')
  const categories = await getCategories()
  return (
    <div>
      <div className="panel-head"><h1 className="title">Mi tienda</h1></div>
      <StoreSettingsForm store={store} categories={categories.map((c) => ({ id: c.id, name: c.name }))} sectores={SECTORES} />
    </div>
  )
}
