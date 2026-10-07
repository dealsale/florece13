import 'server-only'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, open, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

/** Fotos: se aceptan pesadas porque igual se reducen (en el celular y acá) a WebP de pocos cientos de KB. */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024
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
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('La foto pesa más de 40 MB.')

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

/** Videos de historias: se aceptan pesados porque se comprimen acá (máx. 60 s, 720p, H.264). */
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024
export const MAX_VIDEO_SECONDS = 60
/** Si no hay ffmpeg (no debería pasar), se guarda el original solo si es liviano. */
const MAX_RAW_VIDEO_BYTES = 50 * 1024 * 1024
export const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/x-m4v': 'm4v', 'video/3gpp': '3gp' }

let ffmpegPath: string | null | undefined
async function ffmpeg() {
  if (ffmpegPath === undefined) {
    try {
      const p = ((await import('ffmpeg-static')) as unknown as { default: string | null }).default
      ffmpegPath = p && existsSync(p) ? p : null
    } catch {
      ffmpegPath = null
    }
  }
  return ffmpegPath
}

// Comprimir es pesado: como mucho 2 videos a la vez; el resto espera su turno.
let running = 0
const waiting: (() => void)[] = []
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= 2) await new Promise<void>((r) => waiting.push(r))
  running++
  try {
    return await fn()
  } finally {
    running--
    waiting.shift()?.()
  }
}

function run(bin: string, args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => (err = (err + d).slice(-2000)))
    const t = setTimeout(() => p.kill('SIGKILL'), timeoutMs)
    p.on('error', reject)
    p.on('close', (code) => {
      clearTimeout(t)
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg ${code}: ${err}`))
    })
  })
}

/**
 * Video para historias. Llega como stream (sin cargarlo entero en memoria), se valida que de verdad
 * sea MP4/MOV o WebM y se comprime: lado corto 720 px, máx. 30 fps, H.264 + AAC, primeros 60 s.
 * Un video de celular de 80 MB queda en 3–8 MB y se reproduce en cualquier teléfono.
 */
export async function saveVideoStream(body: ReadableStream<Uint8Array>, contentType: string, ownerId: string) {
  const ext = VIDEO_TYPES[contentType]
  if (!ext) throw new UploadError('Subí el video en MP4, MOV o WebM.')
  const dir = path.join(tmpdir(), `f13-${randomUUID()}`)
  await mkdir(dir, { recursive: true })
  const input = path.join(dir, `in.${ext}`)
  const output = path.join(dir, 'out.mp4')
  try {
    // 1. A disco, cortando si se pasa del límite.
    let size = 0
    const out = createWriteStream(input)
    const reader = body.getReader()
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_VIDEO_BYTES) throw new UploadError('El video pesa más de 300 MB. Grabá uno más corto.')
        if (!out.write(value)) await new Promise((r) => out.once('drain', r))
      }
    } finally {
      await new Promise((r) => out.end(r))
    }
    if (size === 0) throw new UploadError('No recibimos el video.')

    // 2. ¿De verdad es un video?
    const head = Buffer.alloc(12)
    const fh = await open(input, 'r')
    await fh.read(head, 0, 12, 0)
    await fh.close()
    const isMp4 = head.subarray(4, 8).toString('latin1') === 'ftyp'
    const isWebm = head.readUInt32BE(0) === 0x1a45dfa3
    if (!(ext === 'webm' ? isWebm : isMp4)) throw new UploadError('No pudimos leer ese video. Probá con otro.')

    // 3. Comprimir.
    const bin = await ffmpeg()
    if (!bin) {
      if (size > MAX_RAW_VIDEO_BYTES) throw new UploadError('El video pesa más de 50 MB. Grabá uno más corto.')
      return store(`historia/${ownerId}/${randomUUID()}.${ext}`, await readFile(input), contentType)
    }
    try {
      await slot(() =>
        run(
          bin,
          [
            '-hide_banner', '-loglevel', 'error', '-y',
            '-i', input,
            '-t', String(MAX_VIDEO_SECONDS),
            '-map', '0:v:0', '-map', '0:a:0?',
            '-vf', "scale='if(gt(iw,ih),-2,min(720,trunc(iw/2)*2))':'if(gt(iw,ih),min(720,trunc(ih/2)*2),-2)',format=yuv420p",
            '-fpsmax', '30',
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-maxrate', '2500k', '-bufsize', '5000k', '-profile:v', 'high',
            '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
            '-movflags', '+faststart',
            output,
          ],
          5 * 60_000,
        ),
      )
    } catch (err) {
      console.error('video', err)
      throw new UploadError('No pudimos procesar ese video. Probá con otro.')
    }
    return store(`historia/${ownerId}/${randomUUID()}.mp4`, await readFile(output), 'video/mp4')
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/** Solo aceptamos URLs de fotos subidas por esta app (evita inyectar enlaces externos). */
export function isOwnMediaUrl(url: string) {
  if (/^\/media\/(producto|logo|portada|historia)\/[\w-]+\/[\w-]+\.(webp|mp4|webm|mov|m4v|3gp)$/.test(url)) return true
  const base = (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')
  return Boolean(base) && url.startsWith(`${base}/`) && /\.(webp|mp4|webm|mov|m4v|3gp)$/.test(url)
}
