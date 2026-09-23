import { ImageResponse } from 'next/og'
import { FLOWER, MARK_VIEWBOX as V, PETALS, THIRTEEN_PATH } from '@/components/logo-geometry'

/** Ícono de app — Ruta B: el 13 con la flor, sobre cemento. */
export function brandIcon(size: number, { padded = false } = {}) {
  const w = size * (padded ? 0.68 : 0.78)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222222' }}>
        <svg width={w} height={(w * V.h) / V.w} viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`}>
          <path d={THIRTEEN_PATH} fill="#F7F3EE" />
          {PETALS.map((p, i) => (
            <circle key={i} cx={FLOWER.cx + p.dx} cy={FLOWER.cy + p.dy} r={p.r} fill={p.color} />
          ))}
        </svg>
      </div>
    ),
    { width: size, height: size },
  )
}
