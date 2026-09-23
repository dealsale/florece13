export const ORDER_STATUS_LABEL = {
  NUEVO: 'Nuevo',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
} as const

export type OrderStatus = keyof typeof ORDER_STATUS_LABEL
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]

export const SECTORES = [
  'Las Independencias I',
  'Las Independencias II',
  'Las Independencias III',
  'El Salado',
  'Nuevos Conquistadores',
  '20 de Julio',
  'Belencito',
  'Betania',
  'El Corazón',
  'La Divisa',
  'Juan XXIII - La Quiebra',
  'San Javier',
  'Eduardo Santos',
  'Antonio Nariño',
  'El Pesebre',
  'Blanquizal',
  'Santa Rosa de Lima',
  'Los Alcázares',
  'Metropolitano',
  'La Pradera',
  'Las Estancias',
  'Otro sector de la Comuna 13',
]
