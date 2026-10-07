import { open, stat } from 'node:fs/promises'
import path from 'node:path'
import { LOCAL_UPLOAD_DIR } from '@/lib/storage'

const TYPES: Record<string, string> = { webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' }

/**
 * Sirve las fotos y videos guardados en disco (STORAGE_DRIVER=local). Con S3 las URLs apuntan al bucket.
 * Soporta pedidos por rangos (Range): Safari/iPhone no reproduce video sin eso.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  if (key.some((part) => !/^[\w-]+(\.(webp|mp4|webm|mov))?$/.test(part))) return new Response('No encontrado', { status: 404 })
  const file = path.join(LOCAL_UPLOAD_DIR, ...key)
  if (!file.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response('No encontrado', { status: 404 })
  const type = TYPES[path.extname(file).slice(1)]
  if (!type) return new Response('No encontrado', { status: 404 })
  try {
    const { size } = await stat(file)
    const headers: Record<string, string> = { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes' }
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '')
    let start = 0
    let end = size - 1
    let status = 200
    if (range && (range[1] || range[2])) {
      start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
      end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
      if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
      status = 206
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`
    }
    const fh = await open(file)
    const buf = Buffer.alloc(end - start + 1)
    await fh.read(buf, 0, buf.length, start)
    await fh.close()
    headers['Content-Length'] = String(buf.length)
    return new Response(new Uint8Array(buf), { status, headers })
  } catch {
    return new Response('No encontrado', { status: 404 })
  }
}
