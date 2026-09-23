import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { LOCAL_UPLOAD_DIR } from '@/lib/storage'

/** Sirve las fotos guardadas en disco (STORAGE_DRIVER=local). Con S3 las URLs apuntan al bucket. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  if (key.some((part) => !/^[\w-]+(\.webp)?$/.test(part))) return new Response('No encontrado', { status: 404 })
  const file = path.join(LOCAL_UPLOAD_DIR, ...key)
  if (!file.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response('No encontrado', { status: 404 })
  try {
    const data = await readFile(file)
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('No encontrado', { status: 404 })
  }
}
