import { NextResponse, type NextRequest } from 'next/server'
import { appUrl, isHostingHost } from '@/lib/url'

/**
 * Quien entra por el dominio técnico de Railway (xxx.up.railway.app) termina en el dominio oficial,
 * con la misma ruta. Así no quedan links, QR ni vistas previas con la dirección vieja.
 * /api queda afuera: el chequeo de salud de Railway entra por ahí.
 */
export function proxy(request: NextRequest) {
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0].trim().split(':')[0]
  const target = new URL(appUrl())
  if (!host || !isHostingHost(host) || isHostingHost(target.host) || target.host === host) return NextResponse.next()
  const url = new URL(request.nextUrl.pathname + request.nextUrl.search, target)
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image).*)'],
}
