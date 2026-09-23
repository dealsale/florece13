import type { SVGProps } from 'react'

/** Íconos de trazo 2 px, esquinas rectas, grilla de 24 (manual §04). */
const PATHS: Record<string, React.ReactNode> = {
  carrito: (<><path d="M3 8h18l-1.5 12h-15z" /><path d="M8 8V5a4 4 0 0 1 8 0v3" /></>),
  ubicacion: (<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  tienda: (<><path d="M4 11 12 4l8 7v8H4z" /><path d="M9 19v-6h6v6" /></>),
  arte: (<><rect x="4" y="4" width="16" height="16" /><path d="M4 15l4-4 4 4 3-3 5 5" /><circle cx="15" cy="8.5" r="1.6" /></>),
  comida: (<><path d="M5 4v7a3 3 0 0 0 6 0V4" /><path d="M8 11v9" /><path d="M17 4c-2 3-2 5-2 8h4c0-3 0-5-2-8z" /><path d="M17 12v8" /></>),
  ropa: (<><path d="M8 4 4 7l2 3 2-1v8h8v-8l2 1 2-3-4-3z" /><path d="M9.5 4a2.5 2.5 0 0 0 5 0" /></>),
  whatsapp: (<><path d="M20 11.5a8 8 0 1 1-3.5-6.6" /><path d="M20 4v5h-5" /><path d="M9 12.5c1.2 2.4 2.3 3.4 4.6 4.5l1.3-2.3 2.6.9" /></>),
  florece: (<><path d="M12 3v6" /><circle cx="12" cy="13" r="3" /><circle cx="6.5" cy="10" r="3" /><circle cx="17.5" cy="10" r="3" /><path d="M12 16v5" /></>),
  artesania: (<><path d="M4 9h16l-2 11H6z" /><path d="M4 9c2-4 14-4 16 0" /><path d="M9 13h6M8 16.5h8" /></>),
  souvenir: (<><rect x="4" y="8" width="16" height="12" /><path d="M12 8v12M4 12h16" /><path d="M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0" /></>),
  servicio: (<><path d="M14.5 5.5a4 4 0 0 0 4 5.6L11 18.6a2 2 0 0 1-2.8-2.8l7.5-7.5" /><path d="M4 20l3-3" /></>),
  inicio: (<><path d="M3 11 12 3l9 8" /><path d="M5 9.5V21h14V9.5" /></>),
  buscar: (<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>),
  usuario: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>),
  mas: (<path d="M12 4v16M4 12h16" />),
  menos: (<path d="M4 12h16" />),
  cerrar: (<path d="M5 5l14 14M19 5 5 19" />),
  basura: (<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>),
  editar: (<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>),
  flecha: (<path d="M5 12h14M13 6l6 6-6 6" />),
  atras: (<path d="M19 12H5M11 6l-6 6 6 6" />),
  check: (<path d="m4 12 5 5L20 6" />),
  qr: (<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4" /></>),
  pedidos: (<><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>),
  instagram: (<><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><path d="M16.5 7.5v.01" /></>),
  camara: (<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>),
  ojo: (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  envio: (<><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>),
  salir: (<><path d="M14 4h6v16h-6" /><path d="M10 8l-4 4 4 4M6 12h10" /></>),
  escudo: (<><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>),
  compartir: (<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></>),
}

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name] ?? PATHS.florece}
    </svg>
  )
}
