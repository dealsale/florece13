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

/** Mensaje que el comprador le envía al comerciante con el resumen del pedido. */
export function orderMessage(order: OrderForMessage, storeName: string, orderUrl: string) {
  const lines = [
    `¡Hola, ${storeName}! Te hago este pedido desde Florece 13:`,
    '',
    ...order.items.map((i) => `• ${i.quantity} × ${i.name} — ${formatPrice(i.unitPrice * i.quantity)}`),
    '',
    `Total: ${formatPrice(order.total)}`,
    order.deliveryMethod === 'ENVIO'
      ? `Envío a: ${order.address}, ${order.city}`
      : 'Lo recojo en la tienda.',
  ]
  if (order.notes) lines.push(`Nota: ${order.notes}`)
  lines.push('', `A nombre de: ${order.customerName}`, `Pedido ${order.code}`, orderUrl)
  return lines.join('\n')
}

export function productMessage(productName: string, price: number, productUrl: string) {
  return `¡Hola! Vi en Florece 13 "${productName}" (${formatPrice(price)}) y me interesa.\n${productUrl}`
}
