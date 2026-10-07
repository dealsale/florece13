/** Tipos de evento de la Agenda 13. */
export const EVENT_KINDS: { key: string; name: string; icon: string }[] = [
  { key: 'musica', name: 'Música', icon: 'musica' },
  { key: 'arte', name: 'Arte', icon: 'arte' },
  { key: 'deportes', name: 'Deportes', icon: 'deporte' },
  { key: 'baile', name: 'Baile', icon: 'baile' },
  { key: 'talleres', name: 'Talleres', icon: 'taller' },
  { key: 'gastronomia', name: 'Gastronomía', icon: 'comida' },
  { key: 'ferias', name: 'Ferias', icon: 'mercado' },
  { key: 'otros', name: 'Otros', icon: 'evento' },
]
export const eventKind = (key: string) => EVENT_KINDS.find((k) => k.key === key) ?? EVENT_KINDS[EVENT_KINDS.length - 1]
