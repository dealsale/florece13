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

export type UploadKind = 'producto' | 'logo' | 'portada'

const SIZES: Record<UploadKind, { width: number; height?: number; fit: 'inside' | 'cover' }> = {
  producto: { width: 1600, fit: 'inside' },
  logo: { width: 512, height: 512, fit: 'cover' },
  portada: { width: 1920, height: 1080, fit: 'cover' },
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

  const key = `${kind}/${ownerId}/${randomUUID()}.webp`

  if (process.env.STORAGE_DRIVER === 's3') {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: 'image/webp',
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

/** Solo aceptamos URLs de fotos subidas por esta app (evita inyectar enlaces externos). */
export function isOwnMediaUrl(url: string) {
  if (/^\/media\/(producto|logo|portada)\/[\w-]+\/[\w-]+\.webp$/.test(url)) return true
  const base = (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')
  return Boolean(base) && url.startsWith(`${base}/`) && /\.webp$/.test(url)
}
