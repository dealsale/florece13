/* Esqueletos de carga: se muestran al instante mientras llega la página (navegación con sensación de app). */

const bar = (w: string | number, h = 14, r = 8) => <span className="shimmer sk" style={{ width: w, height: h, borderRadius: r }} />

export function GridSkeleton({ title = true, n = 6 }: { title?: boolean; n?: number }) {
  return (
    <div className="wrap sec" aria-busy="true" aria-label="Cargando">
      {title && <div className="stack" style={{ ['--gap' as string]: '10px', marginBottom: 20 }}>{bar(120, 16)}{bar('60%', 34, 10)}</div>}
      <div className="grid-prods">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="stack" style={{ ['--gap' as string]: '8px' }}>
            <span className="shimmer sk" style={{ aspectRatio: '4 / 5', width: '100%', borderRadius: 'var(--r-lg)' }} />
            {bar('80%')}
            {bar('40%')}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="stack" style={{ ['--gap' as string]: '14px' }} aria-busy="true" aria-label="Cargando">
      {bar('45%', 34, 10)}
      <div className="list">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="lrow">
            <span className="shimmer sk" style={{ width: 58, height: 58, borderRadius: 12 }} />
            <div className="stack" style={{ ['--gap' as string]: '8px', flex: 1 }}>{bar('70%')}{bar('40%', 12)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton({ cover = false }: { cover?: boolean }) {
  return (
    <div className="wrap sec" aria-busy="true" aria-label="Cargando">
      {cover ? (
        <span className="shimmer sk" style={{ width: '100%', aspectRatio: '16 / 7', borderRadius: 'var(--r-xl)', marginBottom: 20 }} />
      ) : null}
      <div className="p-layout">
        {!cover && <span className="shimmer sk" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--r-xl)' }} />}
        <div className="stack" style={{ ['--gap' as string]: '12px' }}>
          {bar(140, 16)}
          {bar('85%', 34, 10)}
          {bar('35%', 28, 10)}
          {bar('100%')}
          {bar('90%')}
          <span className="shimmer sk" style={{ width: '100%', height: 54, borderRadius: 999, marginTop: 8 }} />
        </div>
      </div>
    </div>
  )
}
