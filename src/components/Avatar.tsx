import { CATEGORY_COLORS } from '@/lib/art'

export function Avatar({ name, src, size = 56, categorySlug }: { name: string; src?: string | null; size?: number; categorySlug?: string | null }) {
  return (
    <span className="av" style={{ ['--s' as string]: `${size}px`, background: src ? undefined : CATEGORY_COLORS[categorySlug ?? ''] }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
