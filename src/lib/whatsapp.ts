import { formatPrice } from './format'

export function waLink(phone: string, text: string) {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
}

type OrderForMessage = {
  code: string
  customerName: string
  deliveryMethod: 'ENVIO' | 'RECOGER'
  city: string
  address: string
  notes: string
  total: number
  items: { name: string; quantity: number; unitPrice: number }[]
}

/*
 * Mensajes prearmados de WhatsApp. WhatsApp muestra *texto* en negrita y arma la vista previa
 * con el primer link del mensaje, por eso el link va al final y solo.
 *
 * Emojis solo cuando se pide desde el celular (`rich`): WhatsApp de computador (Windows/Mac y
 * WhatsApp Web) rompe los emojis que llegan dentro del link y los muestra como "�".
 */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const e = (rich: boolean, emoji: string) => (rich ? `${emoji} ` : '')

/** Mensaje que el comprador le envía al comerciante con el resumen del pedido. */
export function orderMessage(order: OrderForMessage, storeName: string, orderUrl: string, rich = true) {
  const units = order.items.reduce((n, i) => n + i.quantity, 0)
  const lines = [
    `¡Hola, ${storeName}!${rich ? ' 👋🌸' : ''}`,
    'Te hago este pedido desde *Florece 13*:',
    '',
    `${e(rich, '🧾')}*Pedido ${order.code}* · ${plural(units, 'producto', 'productos')}`,
    ...order.items.map((i) => `• ${i.quantity} × ${i.name} — ${formatPrice(i.unitPrice * i.quantity)}`),
    '',
    `${e(rich, '💰')}*Total: ${formatPrice(order.total)}*`,
    order.deliveryMethod === 'ENVIO'
      ? `${e(rich, '🚚')}*Envío a:* ${[order.address, order.city].filter(Boolean).join(', ')}`
      : `${e(rich, '🏪')}*Lo recojo en la tienda*`,
  ]
  if (order.notes) lines.push(`${e(rich, '📝')}*Nota:* ${order.notes}`)
  lines.push(
    `${e(rich, '🙋')}*A nombre de:* ${order.customerName}`,
    '',
    `Quedo pendiente para acordar el pago y la entrega. ¡Gracias!${rich ? ' 💚' : ''}`,
    '',
    `${e(rich, '👉')}Detalle del pedido:`,
    orderUrl,
  )
  return lines.join('\n')
}

/** Respuestas del comerciante al comprador (desde el detalle del pedido en el panel). */
export function merchantReply(
  kind: 'CONFIRMADO' | 'ENVIADO',
  o: { customerName: string; code: string; total: number; storeName: string; orderUrl: string },
  rich = true,
) {
  const first = o.customerName.split(' ')[0]
  if (kind === 'CONFIRMADO') {
    return [
      `¡Hola, ${first}!${rich ? ' 👋' : ''} Te habla *${o.storeName}* desde Florece 13${rich ? ' 🌸' : '.'}`,
      '',
      `${e(rich, '✅')}Confirmamos tu *pedido ${o.code}* por *${formatPrice(o.total)}*.`,
      'Te cuento cómo quedamos con el pago y la entrega:',
    ].join('\n')
  }
  return [
    `¡Hola, ${first}!${rich ? ' 👋' : ''}`,
    `${e(rich, '🚚')}Tu *pedido ${o.code}* de *${o.storeName}* ya va en camino.`,
    '',
    `${e(rich, '👉')}Seguilo aquí:`,
    o.orderUrl,
  ].join('\n')
}

export function productMessage(productName: string, price: number, productUrl: string, rich = true) {
  return [
    `¡Hola!${rich ? ' 👋' : ''} Vi esto en *Florece 13* y me interesa:`,
    '',
    `${e(rich, '🛍️')}*${productName}* — ${formatPrice(price)}`,
    '',
    `¿Está disponible?${rich ? ' 🙌' : ''}`,
    productUrl,
  ].join('\n')
}

export function storeGreeting(storeName: string, storeUrl: string, rich = true) {
  return [`¡Hola, ${storeName}!${rich ? ' 👋🌸' : ''}`, 'Los encontré en *Florece 13* y quiero saber más de sus productos.', storeUrl].join('\n')
}
