import type { MetadataRoute } from 'next'
import { appUrl } from '@/lib/url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', // /pedido queda permitido: WhatsApp respeta robots.txt al armar la vista previa del link (la página lleva noindex).
    disallow: ['/panel', '/admin', '/carrito', '/api', '/offline', '/splash'] },
    sitemap: appUrl('/sitemap.xml'),
  }
}
