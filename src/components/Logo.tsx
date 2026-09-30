import { BRAND_RATIO } from './brand-assets'

/* Logo de Florece 13 (arte en brand/logo-original.jpg; los archivos salen de scripts/brand.mjs). */

/** Símbolo: el 13 ilustrado (la loma, las casas y la flor). */
export function LogoMark({ size = 40, title = 'Florece 13' }: { size?: number; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/mark.webp" alt={title} width={Math.round(size * BRAND_RATIO.mark)} height={size} className="logo-img" />
  )
}

/** Lockup horizontal: el 13 + "Florece". `light` para fondos oscuros. */
export function Logo({ height = 40, tone = 'dark' }: { height?: number; tone?: 'dark' | 'light' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === 'light' ? '/brand/lockup-light.webp' : '/brand/lockup.webp'}
      alt="Florece 13"
      width={Math.round(height * BRAND_RATIO.lockup)}
      height={height}
      className="logo-img"
      fetchPriority="high"
    />
  )
}
