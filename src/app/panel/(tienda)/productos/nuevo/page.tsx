import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductForm } from '@/components/panel/ProductForm'
import { requireMerchant } from '@/lib/auth'
import { getCategories } from '@/lib/queries'

export const metadata: Metadata = { title: 'Nueva publicación' }

export default async function NuevoProductoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { store } = await requireMerchant('/panel/productos/nuevo')
  const [categories, { tipo }] = await Promise.all([getCategories(), searchParams])
  return (
    <div>
      <Link href="/panel/productos" className="small" style={{ fontWeight: 700 }}>← Catálogo</Link>
      <h1 className="h1" style={{ margin: '8px 0 20px' }}>Nueva publicación</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
        defaults={{ kind: tipo === 'servicio' ? 'SERVICIO' : 'PRODUCTO', categoryIds: store.categoryId ? [store.categoryId] : [], isAvailable: true, images: [] }}
      />
    </div>
  )
}
