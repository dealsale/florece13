const cop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/** $ 89.900 */
export function formatPrice(value: number) {
  return `$ ${cop.format(value)}`
}

const dateFmt = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
})

export function formatDate(d: Date) {
  return dateFmt.format(d)
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** Deja solo dígitos y asume Colombia (+57) si el número tiene 10 dígitos. */
export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  return digits
}

export function displayPhone(e164: string) {
  const m = /^57(\d{3})(\d{3})(\d{4})$/.exec(e164)
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : `+${e164}`
}
