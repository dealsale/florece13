/** URL pública de la app. Tolera que APP_URL venga sin protocolo (p. ej. "florece13.up.railway.app"). */
function baseUrl() {
  let base = (process.env.APP_URL ?? '').trim().replace(/\/+$/, '')
  if (!base) return 'http://localhost:3000'
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`
  return base
}

export function appUrl(path = '') {
  return `${baseUrl()}${path}`
}
