'use client'

/** Pedidos hechos desde este celular (para "Tu impacto" sin necesidad de cuenta). */
const KEY = 'f13_mis_pedidos'
export function rememberOrder(id: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!list.includes(id)) localStorage.setItem(KEY, JSON.stringify([id, ...list].slice(0, 200)))
  } catch {}
}
export function myOrderIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
