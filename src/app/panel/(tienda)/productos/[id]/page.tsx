import type { Metadata } from 'next'
import { and, asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db, productImages, products } from '@/db'
import { ProductForm } from '@/components/panel/ProductForm'
import { requireMerchant } from '@/lib/auth'
import { getCategories } from '@/lib/queries'

export const metadata: Metadata = { title: 'Editar producto' }

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { store } = await requireMerchant('/panel/productos')
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.storeId, store.id))).limit(1)
  if (!product) notFound()
  const [images, categories] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.position)),
    getCategories(),
  ])
  return (
    <div>
      <Link href="/panel/productos" className="small" style={{ fontWeight: 700 }}>← Productos</Link>
      <div className="panel-head" style={{ marginTop: 8 }}>
        <h1 className="title">Editar producto</h1>
        <Link href={`/p/${product.id}`} className="btn btn-ghost btn-sm">Ver como comprador</Link>
      </div>
      <ProductForm
        productId={product.id}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{ ...product, images: images.map((i) => i.url) }}
      />
    </div>
  )
}
