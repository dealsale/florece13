import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']

/** Carpeta de fotos con STORAGE_DRIVER=local. En Railway apunta al volumen persistente (UPLOAD_DIR=/data/uploads). */
export const LOCAL_UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads'))

export type UploadKind = 'producto' | 'logo' | 'portada' | 'historia'

const SIZES: Record<UploadKind, { width: number; height?: number; fit: 'inside' | 'cover' }> = {
  producto: { width: 1600, fit: 'inside' },
  logo: { width: 512, height: 512, fit: 'cover' },
  portada: { width: 1920, height: 1080, fit: 'cover' },
  historia: { width: 1080, height: 1920, fit: 'inside' },
}

let s3: S3Client | null = null
function s3Client() {
  s3 ??= new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  })
  return s3
}

export class UploadError extends Error {}

/**
 * Valida la imagen, la corrige de orientación, la reduce y la guarda como WebP.
 * Devuelve la URL pública.
 */
export async function saveImage(file: File, kind: UploadKind, ownerId: string) {
  if (!ACCEPTED.includes(file.type)) throw new UploadError('Subí una foto en JPG, PNG, WebP o HEIC.')
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('La foto pesa más de 12 MB.')

  const size = SIZES[kind]
  let data: Buffer
  try {
    data = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: size.width, height: size.height, fit: size.fit, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw new UploadError('No pudimos leer esa foto. Probá con otra.')
  }

  return store(`${kind}/${ownerId}/${randomUUID()}.webp`, data, 'image/webp')
}

async function store(key: string, data: Buffer, contentType: string) {
  if (process.env.STORAGE_DRIVER === 's3') {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    return `${(process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')}/${key}`
  }

  const dest = path.join(LOCAL_UPLOAD_DIR, key)
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, data)
  return `/media/${key}`
}

export const MAX_VIDEO_BYTES = 40 * 1024 * 1024
export const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }

/** Video corto para historias: se guarda tal cual (se valida que de verdad sea MP4/MOV o WebM). */
export async function saveVideo(file: File, ownerId: string) {
  const ext = VIDEO_TYPES[file.type]
  if (!ext) throw new UploadError('Subí el video en MP4, MOV o WebM.')
  if (file.size > MAX_VIDEO_BYTES) throw new UploadError('El video pesa más de 40 MB. Grabá uno más corto (15 a 30 segundos).')
  const data = Buffer.from(await file.arrayBuffer())
  const isMp4 = data.subarray(4, 8).toString('latin1') === 'ftyp'
  const isWebm = data.readUInt32BE(0) === 0x1a45dfa3
  if (!(ext === 'webm' ? isWebm : isMp4)) throw new UploadError('No pudimos leer ese video. Probá con otro.')
  return store(`historia/${ownerId}/${randomUUID()}.${ext}`, data, file.type)
}

/** Solo aceptamos URLs de fotos subidas por esta app (evita inyectar enlaces externos). */
export function isOwnMediaUrl(url: string) {
  if (/^\/media\/(producto|logo|portada|historia)\/[\w-]+\/[\w-]+\.(webp|mp4|webm|mov)$/.test(url)) return true
  const base = (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')
  return Boolean(base) && url.startsWith(`${base}/`) && /\.(webp|mp4|webm|mov)$/.test(url)
}
