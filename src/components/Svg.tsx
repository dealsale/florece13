/** Inserta un SVG generado por lib/art (contenido propio, sin datos de usuarios). */
export function Svg({ html, className = 'svg-fill' }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
