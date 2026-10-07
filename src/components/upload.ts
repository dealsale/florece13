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

export async function uploadImage(file: File, tipo: 'producto' | 'logo' | 'portada' | 'historia'): Promise<string> {
  return (await uploadMedia(file, tipo)).url
}

export type UploadProgress = { phase: 'subiendo' | 'procesando'; pct: number }

const VIDEO_EXT: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/x-m4v', mov: 'video/quicktime', webm: 'video/webm', '3gp': 'video/3gpp' }
const MAX_VIDEO_MB = 300

/** Algunos celulares no dicen el tipo del video: lo deducimos de la extensión. */
function videoType(file: File) {
  if (file.type && file.type !== 'video/x-matroska') return file.type
  return VIDEO_EXT[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? file.type
}

/** El video va crudo (sin formulario) para que el servidor lo reciba por partes; XHR para mostrar el avance. */
function uploadVideo(file: File, onProgress?: (p: UploadProgress) => void) {
  return new Promise<{ url: string; mediaType: 'video' }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/subir?tipo=historia')
    xhr.setRequestHeader('Content-Type', videoType(file))
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return
      const pct = e.loaded / e.total
      onProgress?.(pct >= 1 ? { phase: 'procesando', pct: 1 } : { phase: 'subiendo', pct })
    }
    xhr.upload.onload = () => onProgress?.({ phase: 'procesando', pct: 1 })
    xhr.onload = () => {
      let data: { url?: string; error?: string } = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve({ url: data.url, mediaType: 'video' })
      else reject(new Error(data.error ?? 'No pudimos subir el video.'))
    }
    xhr.onerror = () => reject(new Error('Se cortó la conexión. Intentá de nuevo con mejor señal.'))
    xhr.send(file)
  })
}

/** Foto (se reduce en el celular) o, solo para historias, video (se comprime en el servidor). */
export async function uploadMedia(file: File, tipo: 'producto' | 'logo' | 'portada' | 'historia', onProgress?: (p: UploadProgress) => void): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  if (tipo === 'historia' && (file.type.startsWith('video/') || /\.(mp4|m4v|mov|webm|3gp)$/i.test(file.name))) {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`El video pesa más de ${MAX_VIDEO_MB} MB. Grabá uno más corto.`)
    return uploadVideo(file, onProgress)
  }
  const blob = await shrink(file, tipo === 'portada' || tipo === 'historia' ? 2200 : 1800)
  if (blob.size > 40 * 1024 * 1024) throw new Error('La foto pesa más de 40 MB.')
  const body = new FormData()
  body.append('foto', blob, blob === file ? file.name : 'foto.jpg')
  const res = await fetch(`/api/subir?tipo=${tipo}`, { method: 'POST', body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) throw new Error(data.error ?? 'No pudimos subir la foto.')
  return { url: data.url, mediaType: 'image' }
}
