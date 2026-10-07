import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { MAX_VIDEO_BYTES, saveImage, saveVideoStream, UploadError, VIDEO_TYPES, type UploadKind } from '@/lib/storage'

const KINDS: UploadKind[] = ['producto', 'logo', 'portada', 'historia']

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tenés que entrar a tu cuenta.' }, { status: 401 })

  const kind = new URL(request.url).searchParams.get('tipo') as UploadKind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Tipo de foto inválido.' }, { status: 400 })

  // Video de historia: llega crudo (no como formulario) para no cargarlo entero en memoria.
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim()
  if (kind === 'historia' && VIDEO_TYPES[type]) {
    if (Number(request.headers.get('content-length') ?? 0) > MAX_VIDEO_BYTES) return NextResponse.json({ error: 'El video pesa más de 300 MB. Grabá uno más corto.' }, { status: 413 })
    if (!request.body) return NextResponse.json({ error: 'No recibimos el video.' }, { status: 400 })
    try {
      return NextResponse.json({ url: await saveVideoStream(request.body, type, user.id), mediaType: 'video' })
    } catch (err) {
      if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 })
      console.error('upload video', err)
      return NextResponse.json({ error: 'No pudimos guardar el video. Intentá de nuevo.' }, { status: 500 })
    }
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('foto')
  } catch {
    return NextResponse.json({ error: 'No recibimos la foto.' }, { status: 400 })
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'No recibimos la foto.' }, { status: 400 })

  try {
    const url = await saveImage(file, kind, user.id)
    return NextResponse.json({ url, mediaType: 'image' })
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('upload', err)
    return NextResponse.json({ error: 'No pudimos guardar la foto. Intentá de nuevo.' }, { status: 500 })
  }
}
