'use client'

import { useState } from 'react'
import { Svg } from './Svg'

export function Gallery({ images, alt, fallbackSvg }: { images: string[]; alt: string; fallbackSvg: string }) {
  const [current, setCurrent] = useState(0)
  return (
    <div>
      <div className="gal__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {images.length ? <img key={current} src={images[current]} alt={alt} /> : <Svg html={fallbackSvg} />}
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
