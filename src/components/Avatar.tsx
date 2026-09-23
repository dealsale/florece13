export function Avatar({ name, src, size = 56 }: { name: string; src?: string | null; size?: number }) {
  return (
    <span className="avatar" style={{ ['--size' as string]: `${size}px` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
