'use client'

import { useEffect, useState } from 'react'
import { useProductView } from './ProductView'

export function Gallery({ images, alt, fallbackSrc }: { images: string[]; alt: string; fallbackSrc: string }) {
  const [current, setCurrent] = useState(0)
  // Al elegir una opción con foto (p. ej. el color), la galería salta a esa foto.
  const target = useProductView()?.image
  useEffect(() => {
    if (!target) return
    const i = images.indexOf(target)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con la opción elegida
    if (i >= 0) setCurrent(i)
  }, [target, images])
  return (
    <div>
      <div className="gal__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={current} src={images.length ? images[current] : fallbackSrc} alt={alt} />
      </div>
      {images.length > 1 && (
        <div className="gal__thumbs">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => setCurrent(i)} aria-current={i === current} aria-label={`Foto ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
