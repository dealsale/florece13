import type { Metadata } from 'next'
import { MapLoader } from '@/components/map/MapLoader'
import { eventKind } from '@/lib/agenda'
import { listEvents } from '@/lib/live-queries'
import { getMapStores } from '@/lib/queries'
import { SITE_OG_IMAGE } from '@/lib/seo'
import { agendaRange, whenLabel } from '@/lib/time'

export const metadata: Metadata = {
  title: 'Mapa de la 13',
  description: 'El mapa comercial de la Comuna 13: tiendas, comida, barberías, cafés, arte, eventos y ofertas Flash, en vivo.',
  alternates: { canonical: '/mapa' },
  openGraph: { title: 'Mapa vivo de la Comuna 13 · Florece 13', url: '/mapa', images: [SITE_OG_IMAGE] },
}

export default async function MapaPage() {
  const [from, to] = agendaRange('finde')
  const [stores, events] = await Promise.all([getMapStores(), listEvents({ from: new Date(), to: new Date(Math.max(to.getTime(), from.getTime() + 2 * 86400_000)) })])
  const evs = events
    .filter((e) => e.lat != null && e.lng != null)
    .map((e) => ({ id: e.id, title: e.title, when: whenLabel(e.startsAt), lat: e.lat!, lng: e.lng!, storeName: e.storeName, icon: eventKind(e.category).icon }))
  return (
    <div className="map-page">
      <h1 className="vh">Mapa de la Comuna 13</h1>
      <MapLoader stores={stores} events={evs} />
    </div>
  )
}
