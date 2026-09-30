import { formatPrice } from './format'

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
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
 * con el primer link del mensaje, por eso el link del pedido va al final y solo.
 */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Mensaje que el comprador le envía al comerciante con el resumen del pedido. */
export function orderMessage(order: OrderForMessage, storeName: string, orderUrl: string) {
  const units = order.items.reduce((n, i) => n + i.quantity, 0)
  const lines = [
    `¡Hola, ${storeName}! 👋🌸`,
    'Te hago este pedido desde *Florece 13*:',
    '',
    `🧾 *Pedido ${order.code}* · ${plural(units, 'producto', 'productos')}`,
    ...order.items.map((i) => `▪️ ${i.quantity} × ${i.name} — ${formatPrice(i.unitPrice * i.quantity)}`),
    '',
    `💰 *Total: ${formatPrice(order.total)}*`,
    order.deliveryMethod === 'ENVIO'
      ? `🚚 *Envío a:* ${[order.address, order.city].filter(Boolean).join(', ')}`
      : '🏪 *Lo recojo en la tienda*',
  ]
  if (order.notes) lines.push(`📝 *Nota:* ${order.notes}`)
  lines.push(`🙋 *A nombre de:* ${order.customerName}`, '', 'Quedo pendiente para acordar el pago y la entrega. ¡Gracias! 💚', '', '👉 Detalle del pedido:', orderUrl)
  return lines.join('\n')
}

/** Respuestas del comerciante al comprador (desde el detalle del pedido en el panel). */
export function merchantReply(kind: 'CONFIRMADO' | 'ENVIADO', o: { customerName: string; code: string; total: number; storeName: string; orderUrl: string }) {
  const first = o.customerName.split(' ')[0]
  if (kind === 'CONFIRMADO') {
    return [
      `¡Hola, ${first}! 👋 Te habla *${o.storeName}* desde Florece 13 🌸`,
      '',
      `✅ Confirmamos tu *pedido ${o.code}* por *${formatPrice(o.total)}*.`,
      'Te cuento cómo quedamos con el pago y la entrega:',
    ].join('\n')
  }
  return [
    `¡Hola, ${first}! 👋`,
    `🚚 Tu *pedido ${o.code}* de *${o.storeName}* ya va en camino.`,
    '',
    '👉 Seguilo aquí:',
    o.orderUrl,
  ].join('\n')
}

export function productMessage(productName: string, price: number, productUrl: string) {
  return [`¡Hola! 👋 Vi esto en *Florece 13* y me interesa:`, '', `🛍️ *${productName}* — ${formatPrice(price)}`, '', '¿Está disponible? 🙌', productUrl].join('\n')
}

export function storeGreeting(storeName: string, storeUrl: string) {
  return [`¡Hola, ${storeName}! 👋🌸`, 'Los encontré en *Florece 13* y quiero saber más de sus productos.', storeUrl].join('\n')
}
