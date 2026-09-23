import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db, stores } from '@/db'
import { CheckoutForm } from './CheckoutForm'

export const metadata: Metadata = { title: 'Hacer pedido' }

export default async function CheckoutPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(storeId)) notFound()
  const [store] = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      status: stores.status,
      shipsNationwide: stores.shipsNationwide,
      allowsPickup: stores.allowsPickup,
      sector: stores.sector,
      address: stores.address,
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1)
  if (!store || store.status !== 'ACTIVE') notFound()

  return (
    <div className="wrap">
      <section style={{ paddingTop: 28 }}>
        <span className="eyebrow">Pedido a</span>
        <h1 className="h1" style={{ margin: '6px 0 24px' }}>{store.name}</h1>
        <CheckoutForm store={store} />
      </section>
    </div>
  )
}
