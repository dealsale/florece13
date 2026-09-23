import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductForm } from '@/components/panel/ProductForm'
import { requireMerchant } from '@/lib/auth'
import { getCategories } from '@/lib/queries'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NuevoProductoPage() {
  const { store } = await requireMerchant('/panel/productos/nuevo')
  const categories = await getCategories()
  return (
    <div>
      <Link href="/panel/productos" className="small" style={{ fontWeight: 700 }}>← Productos</Link>
      <h1 className="title" style={{ margin: '8px 0 20px' }}>Nuevo producto</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{ categoryId: store.categoryId, isAvailable: true, images: [] }}
      />
    </div>
  )
}
