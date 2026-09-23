import { FLOWER, MARK_VIEWBOX as V, PETALS, THIRTEEN_PATH } from './logo-geometry'

type MarkProps = { size?: number; tone?: 'dark' | 'light' | 'mono'; title?: string }

/** Símbolo — Ruta B "El 13 que florece": la flor corona el 1. */
export function LogoMark({ size = 40, tone = 'dark', title = 'Florece 13' }: MarkProps) {
  const ink = tone === 'light' ? '#F7F3EE' : '#222222'
  return (
    <svg
      width={(size * V.w) / V.h}
      height={size}
      viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <path d={THIRTEEN_PATH} fill={ink} />
      <g transform={`translate(${FLOWER.cx},${FLOWER.cy})`}>
        {PETALS.map((p, i) => (
          <circle key={i} cx={p.dx} cy={p.dy} r={p.r} fill={tone === 'mono' ? (i === 3 ? '#F7F3EE' : ink) : p.color} />
        ))}
      </g>
    </svg>
  )
}

/** Lockup horizontal: "Florece" + símbolo. */
export function Logo({ height = 34, tone = 'dark' }: { height?: number; tone?: 'dark' | 'light' }) {
  const ink = tone === 'light' ? '#F7F3EE' : '#222222'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: height * 0.1, lineHeight: 1 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: height * 0.62, letterSpacing: '-0.02em', color: ink, paddingBottom: height * 0.03 }}>
        Florece
      </span>
      <LogoMark size={height} tone={tone} title="" />
      <span className="visually-hidden">Florece 13</span>
    </span>
  )
}
