'use client'

import { useState } from 'react'
import { Icon } from './Icon'

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0)
  if (images.length === 0) {
    return (
      <div className="gallery__main">
        <div className="no-photo"><Icon name="camara" size={48} /></div>
      </div>
    )
  }
  return (
    <div className="gallery">
      <div className="gallery__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[current]} alt={alt} />
      </div>
      {images.length > 1 && (
        <div className="gallery__thumbs">
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
