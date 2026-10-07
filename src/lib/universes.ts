/**
 * Los grandes universos de la 13. Los cuatro primeros agrupan categorías; Ofertas, Eventos y Empleo
 * son tipos de publicación propios (Florece Flash, agenda y vacantes).
 */
export type UniverseKey = 'comprar' | 'comer' | 'servicios' | 'experiencias' | 'ofertas' | 'eventos' | 'empleo'

export const UNIVERSES: { key: UniverseKey; name: string; icon: string; color: string; tint: string; href: string; blurb: string }[] = [
  { key: 'comprar', name: 'Comprar', icon: 'carrito', color: '#17BEBB', tint: '#D6F4F3', href: '/u/comprar', blurb: 'Ropa, tecnología, regalos, mercados y emprendimientos' },
  { key: 'comer', name: 'Comer', icon: 'comida', color: '#FF8A00', tint: '#FFEBD2', href: '/u/comer', blurb: 'Restaurantes, comidas rápidas, panaderías y cafés' },
  { key: 'servicios', name: 'Servicios', icon: 'tijeras', color: '#6B5BD2', tint: '#E7E4F6', href: '/u/servicios', blurb: 'Barberías, uñas, tatuajes, técnicos y profesores' },
  { key: 'experiencias', name: 'Experiencias', icon: 'experiencia', color: '#E5379B', tint: '#FCE4F1', href: '/u/experiencias', blurb: 'Grafiti, baile, música, talleres y tours' },
  { key: 'ofertas', name: 'Ofertas', icon: 'rayo', color: '#E5379B', tint: '#FCE4F1', href: '/ofertas', blurb: 'Florece Flash: ofertas que duran horas' },
  { key: 'eventos', name: 'Eventos', icon: 'evento', color: '#2ECC71', tint: '#DDF6E7', href: '/eventos', blurb: 'Freestyle, talleres abiertos, conciertos y ferias' },
  { key: 'empleo', name: 'Empleo', icon: 'maletin', color: '#9C4A2F', tint: '#F3E0D8', href: '/empleo', blurb: 'Lo que los negocios del barrio están buscando' },
]

export const CATEGORY_UNIVERSES = UNIVERSES.slice(0, 4)
export const universe = (key: string) => UNIVERSES.find((u) => u.key === key)
