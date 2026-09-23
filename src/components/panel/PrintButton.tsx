'use client'

export function PrintButton() {
  return (
    <button type="button" className="btn btn-outline" onClick={() => window.print()}>
      Imprimir sticker
    </button>
  )
}
