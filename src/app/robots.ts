import type { MetadataRoute } from 'next'
import { appUrl } from '@/lib/url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/panel', '/admin', '/pedido', '/carrito', '/api', '/offline', '/splash'] },
    sitemap: appUrl('/sitemap.xml'),
  }
}
