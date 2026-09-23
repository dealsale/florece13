/** Se vuelve a montar en cada navegación: anima la entrada de la página. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page">{children}</div>
}
