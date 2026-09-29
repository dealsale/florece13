import { brandIcon } from '@/lib/brand-icon'

/** Íconos extra del manifest: 192 px (Android) y "maskable" (el sistema lo recorta en círculo o gota). */
const ICONS: Record<string, { size: number; scale?: number }> = {
  'icon-192.png': { size: 192 },
  'maskable-512.png': { size: 512, scale: 0.56 },
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const icon = ICONS[(await params).name]
  if (!icon) return new Response('No encontrado', { status: 404 })
  const res = brandIcon(icon.size, { scale: icon.scale })
  res.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  return res
}
