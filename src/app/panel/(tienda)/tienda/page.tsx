import type { Metadata } from 'next'
import { StoreSettingsForm } from '@/components/panel/StoreSettingsForm'
import { requireMerchant } from '@/lib/auth'
import { SECTORES } from '@/lib/orders'
import { getCategories, getStoreCategoryIds } from '@/lib/queries'

export const metadata: Metadata = { title: 'Mi tienda' }

export default async function TiendaSettingsPage() {
  const { store } = await requireMerchant('/panel/tienda')
  const [categories, categoryIds] = await Promise.all([getCategories(), getStoreCategoryIds(store.id, store.categoryId)])
  return (
    <div>
      <div className="phead"><h1 className="h1">Mi tienda</h1></div>
      <StoreSettingsForm store={{ ...store, categoryIds }} categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))} sectores={SECTORES} />
    </div>
  )
}
