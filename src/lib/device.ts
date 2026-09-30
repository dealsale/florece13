import 'server-only'
import { headers } from 'next/headers'

/** ¿La página la pidió un celular o tablet? (para decidir si los mensajes de WhatsApp llevan emojis). */
export async function isMobileRequest() {
  const ua = (await headers()).get('user-agent') ?? ''
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}
