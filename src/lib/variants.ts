import type { ProductOption } from '@/db/schema'

/* Utilidades de variantes (sirven en el servidor y en el navegador). */

export const MAX_OPTION_GROUPS = 2
export const MAX_OPTION_VALUES = 15
export const MAX_VARIANTS = 60

/** "Negro / M" */
export const variantLabel = (values: string[]) => values.join(' / ')
export const variantKey = (values: string[]) => values.map((v) => v.trim().toLowerCase()).join('|')

/** Todas las combinaciones de los valores de cada grupo, en orden. */
export function combinations(options: ProductOption[]): string[][] {
  const groups = options.filter((o) => o.values.length > 0)
  if (groups.length === 0) return []
  return groups.reduce<string[][]>((acc, g) => acc.flatMap((combo) => g.values.map((v) => [...combo, v.v])), [[]])
}

/** Foto asociada a una combinación: la del primer valor elegido que tenga foto. */
export function variantImage(options: ProductOption[], values: string[]) {
  for (let i = 0; i < options.length; i++) {
    const img = options[i]?.values.find((v) => v.v === values[i])?.img
    if (img) return img
  }
  return null
}
