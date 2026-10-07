'use client'

import dynamic from 'next/dynamic'
import type { MapStore } from '@/lib/queries'
import type { MapEvent } from './LiveMap'

/** El mapa solo existe en el navegador. */
const LiveMap = dynamic(() => import('./LiveMap').then((m) => m.LiveMap), { ssr: false, loading: () => <div className="lmap shimmer" /> })

export function MapLoader(props: { stores: MapStore[]; events: MapEvent[] }) {
  return <LiveMap {...props} />
}
