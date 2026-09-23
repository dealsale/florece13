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
      <div className="panel-head">
        <h1 className="title">Productos</h1>
        <Link href="/panel/productos/nuevo" className="btn btn-primary"><Icon name="mas" size={18} /> Nuevo</Link>
      </div>
      {creado && <div className="alert alert-ok" style={{ marginBottom: 16 }}>¡Producto publicado!</div>}
      {rows.length === 0 ? (
        <EmptyState title="Aquí florecerán tus productos." text="Publicá el primero: una buena foto, el precio y cuéntale al comprador qué lo hace especial.">
          <Link href="/panel/productos/nuevo" className="btn btn-primary">Publicar el primero</Link>
        </EmptyState>
      ) : (
        <div className="list">
          {rows.map((p) => (
            <div key={p.id} className="list-row">
              <Link href={`/panel/productos/${p.id}`} className="list-row__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div className="no-photo"><Icon name="camara" /></div>}
              </Link>
              <Link href={`/panel/productos/${p.id}`} className="list-row__main" style={{ color: 'var(--cemento)' }}>
                <div className="list-row__title">{p.name}</div>
                <div className="list-row__sub tnum">{formatPrice(p.price)}</div>
              </Link>
              <form action={toggleAvailability.bind(null, p.id)}>
                <button className={`chip ${p.isAvailable ? 'chip-florece' : 'chip-outline'}`} style={{ border: 0, cursor: 'pointer', minHeight: 32 }} title="Cambiar disponibilidad">
                  {p.isAvailable ? 'Disponible' : 'Agotado'}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
