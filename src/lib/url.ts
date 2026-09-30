/** Dominio oficial. Los links que salen de la app (WhatsApp, QR, redes, Google) siempre usan este. */
export const SITE_URL = 'https://florece13.shop'

/** Dominios técnicos del hosting: nunca se usan en links públicos y redirigen al oficial. */
export const isHostingHost = (host: string) => /\.up\.railway\.app$|\.railway\.internal$/i.test(host)

/**
 * URL pública de la app. Sale de APP_URL (tolera que venga sin protocolo). Si APP_URL no está
 * o apunta al dominio técnico de Railway, en producción se usa el dominio oficial.
 */
function baseUrl() {
  let base = (process.env.APP_URL ?? '').trim().replace(/\/+$/, '')
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`
  if (base && !isHostingHost(new URL(base).host)) return base
  return process.env.NODE_ENV === 'production' ? SITE_URL : base || 'http://localhost:3000'
}

export function appUrl(path = '') {
  return `${baseUrl()}${path}`
}
