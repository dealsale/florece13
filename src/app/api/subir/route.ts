import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { saveImage, UploadError, type UploadKind } from '@/lib/storage'

const KINDS: UploadKind[] = ['producto', 'logo', 'portada']

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tenés que entrar a tu cuenta.' }, { status: 401 })

  const kind = new URL(request.url).searchParams.get('tipo') as UploadKind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Tipo de foto inválido.' }, { status: 400 })

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('foto')
  } catch {
    return NextResponse.json({ error: 'No recibimos la foto.' }, { status: 400 })
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'No recibimos la foto.' }, { status: 400 })

  try {
    const url = await saveImage(file, kind, user.id)
    return NextResponse.json({ url })
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('upload', err)
    return NextResponse.json({ error: 'No pudimos guardar la foto. Intentá de nuevo.' }, { status: 500 })
  }
}
