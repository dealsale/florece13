import type { Metadata } from 'next'
import { asc, desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'
import { db, products } from '@/db'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { toggleAvailability } from '@/lib/actions/merchant'
import { requireMerchant } from '@/lib/auth'
import { formatPrice } from '@/lib/format'
import { firstImage } from '@/lib/queries'

export const metadata: Metadata = { title: 'Catálogo' }

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { store } = await requireMerchant('/panel/productos')
  const { creado } = await searchParams
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      isAvailable: products.isAvailable,
      kind: products.kind,
      priceFrom: products.priceFrom,
      optionCount: sql<number>`jsonb_array_length(${products.options})`,
      imageUrl: firstImage,
    })
    .from(products)
    .where(eq(products.storeId, store.id))
    .orderBy(desc(products.isAvailable), desc(products.createdAt), asc(products.name))

  return (
    <div>
      <div className="phead">
        <h1 className="h1">Catálogo</h1>
        <Link href="/panel/productos/nuevo" className="btn btn-primary" data-tour="p-nuevo"><Icon name="mas" size={18} /> Nuevo</Link>
      </div>
      {creado && <div className="note note-ok" style={{ marginBottom: 16 }}>¡Producto publicado!</div>}
      {rows.length === 0 ? (
        <EmptyState title="Aquí florecerán tus productos y servicios." text="Publicá el primero: una buena foto, el precio y contale al comprador qué lo hace especial. También podés ofrecer servicios o experiencias.">
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
                <div className="lrow__s tnum">
                  {p.kind === 'SERVICIO' && <span className="chip chip-kind">Servicio</span>} {p.priceFrom ? 'Desde ' : ''}
                  {formatPrice(p.price)} · {p.isAvailable ? 'Disponible' : p.kind === 'SERVICIO' ? 'Pausado' : 'Agotado'}
                  {p.optionCount > 0 && ' · con opciones'}
                </div>
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
