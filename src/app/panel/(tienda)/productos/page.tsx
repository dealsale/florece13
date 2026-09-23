import type { Metadata } from 'next'
import { asc, desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'
import { db, productImages, products } from '@/db'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { toggleAvailability } from '@/lib/actions/merchant'
import { requireMerchant } from '@/lib/auth'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { store } = await requireMerchant('/panel/productos')
  const { creado } = await searchParams
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      isAvailable: products.isAvailable,
      imageUrl: sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = ${products.id} order by ${productImages.position} limit 1)`,
    })
    .from(products)
    .where(eq(products.storeId, store.id))
    .orderBy(desc(products.isAvailable), desc(products.createdAt), asc(products.name))

  return (
    <div>
      <div className="phead">
        <h1 className="h1">Productos</h1>
        <Link href="/panel/productos/nuevo" className="btn btn-primary"><Icon name="mas" size={18} /> Nuevo</Link>
      </div>
      {creado && <div className="note note-ok" style={{ marginBottom: 16 }}>¡Producto publicado!</div>}
      {rows.length === 0 ? (
        <EmptyState title="Aquí florecerán tus productos." text="Publicá el primero: una buena foto, el precio y cuéntale al comprador qué lo hace especial.">
          <Link href="/panel/productos/nuevo" className="btn btn-primary">Publicar el primero</Link>
        </EmptyState>
      ) : (
        <div className="list">
          {rows.map((p) => (
            <div key={p.id} className="lrow">
              <Link href={`/panel/productos/${p.id}`} className="lrow__th">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div className="no-photo"><Icon name="camara" /></div>}
              </Link>
              <Link href={`/panel/productos/${p.id}`} className="lrow__m" >
                <div className="lrow__t">{p.name}</div>
                <div className="lrow__s tnum">{formatPrice(p.price)} · {p.isAvailable ? 'Disponible' : 'Agotado'}</div>
              </Link>
              <form action={toggleAvailability.bind(null, p.id)}>
                <button type="submit" className="switch" role="switch" aria-checked={p.isAvailable} aria-label={p.isAvailable ? 'Disponible: tocá para marcar agotado' : 'Agotado: tocá para marcar disponible'} />
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
