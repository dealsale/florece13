'use client'

/** Reduce la foto en el celular antes de subirla para ahorrar datos. Si no se puede, sube la original. */
async function shrink(file: File, maxSide: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88))
    return blob ?? file
  } catch {
    return file
  }
}

export async function uploadImage(file: File, tipo: 'producto' | 'logo' | 'portada'): Promise<string> {
  const blob = await shrink(file, tipo === 'portada' ? 2200 : 1800)
  const body = new FormData()
  body.append('foto', blob, blob === file ? file.name : 'foto.jpg')
  const res = await fetch(`/api/subir?tipo=${tipo}`, { method: 'POST', body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) throw new Error(data.error ?? 'No pudimos subir la foto.')
  return data.url
}
