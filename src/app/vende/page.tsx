import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { LogoMark } from '@/components/Logo'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Vendé en Florece 13',
  description: 'Abrí tu tienda de la Comuna 13 en línea y recibí pedidos de todo el país directo en tu WhatsApp.',
}

const STEPS = [
  { title: 'Creá tu cuenta', text: 'Tu nombre, tu correo y una clave. Dos minutos.' },
  { title: 'Armá tu tienda', text: 'Nombre, WhatsApp, tu sector de la 13, logo, portada y tu historia.' },
  { title: 'Publicá tus productos', text: 'Foto, precio y descripción, desde el celular.' },
  { title: 'Recibí pedidos', text: 'Te llegan a tu WhatsApp con todo el detalle, y los ves ordenados en tu panel.' },
]

export default async function VendePage() {
  const user = await getCurrentUser()
  const cta = user ? { href: '/panel', label: 'Ir a mi tienda' } : { href: '/registro', label: 'Abrí tu tienda gratis' }
  return (
    <>
      <section className="panel-dark">
        <div className="container" style={{ padding: 'clamp(40px, 8vw, 96px) var(--gutter)' }}>
          <LogoMark size={64} tone="light" />
          <h1 className="display" style={{ marginTop: 24, maxWidth: '12ch' }}>Tu negocio florece aquí.</h1>
          <p style={{ fontSize: 'clamp(17px, 2.2vw, 21px)', lineHeight: 1.5, color: '#BDB5A9', maxWidth: '48ch', marginTop: 18 }}>
            La vitrina en línea de los comercios de la Comuna 13. Mostrale tus productos a toda Colombia y recibí los pedidos en tu WhatsApp, como ya
            trabajás hoy.
          </p>
          <div className="row" style={{ marginTop: 28 }}>
            <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label}</Link>
            {!user && <Link href="/entrar" className="btn btn-outline btn-lg" style={{ color: 'var(--hueso)', borderColor: 'var(--hueso)' }}>Ya tengo tienda</Link>}
          </div>
        </div>
        <div className="mural-band" aria-hidden="true" />
      </section>

      <div className="container">
        <section className="section">
          <h2 className="title" style={{ marginBottom: 20 }}>Así de fácil</h2>
          <div className="pitch-grid">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <span className="pitch-num">0{i + 1}</span>
                <h3 className="subtitle">{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="pitch-grid">
            <div>
              <Icon name="whatsapp" size={28} />
              <h3 className="subtitle">Pedidos a tu WhatsApp</h3>
              <p className="muted">El comprador arma su pedido y te lo manda escrito. Vos acordás el pago (Nequi, transferencia, contraentrega) y el envío.</p>
            </div>
            <div>
              <Icon name="tienda" size={28} />
              <h3 className="subtitle">Tu propia tienda</h3>
              <p className="muted">Con tu link, tu portada, tu catálogo y tu historia. Compartila en Instagram y en tus estados.</p>
            </div>
            <div>
              <Icon name="qr" size={28} />
              <h3 className="subtitle">QR para tu local</h3>
              <p className="muted">Imprimí tu sticker “Florece aquí”. El turista lo escanea y te sigue comprando cuando vuelve a su casa.</p>
            </div>
            <div>
              <Icon name="escudo" size={28} />
              <h3 className="subtitle">Solo gente de la 13</h3>
              <p className="muted">Revisamos cada tienda antes de publicarla. Así el comprador sabe que le está comprando al barrio.</p>
            </div>
          </div>
        </section>

        <section className="section" id="fotos">
          <div className="card card-pad stack" style={{ ['--gap' as string]: '14px' }}>
            <h2 className="title-sm">Guía de fotos: tu foto es el corazón de la ficha</h2>
            <div className="pitch-grid" style={{ border: 0, background: 'transparent', gap: 20 }}>
              <div style={{ padding: 0 }}><strong>Fondo liso</strong><p className="muted">Un muro o una tela de un solo color. Que nada distraiga del producto.</p></div>
              <div style={{ padding: 0 }}><strong>Luz de día</strong><p className="muted">Cerca de una ventana o en la calle a la sombra. Sin flash.</p></div>
              <div style={{ padding: 0 }}><strong>Una pieza por foto</strong><p className="muted">Producto centrado. Si tiene detalles, tomale otra foto de cerca.</p></div>
              <div style={{ padding: 0 }}><strong>Siempre real</strong><p className="muted">Tus productos, tus manos, tu local. Nada de fotos sacadas de internet.</p></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel-dark card-pad" style={{ display: 'grid', gap: 18, textAlign: 'center', justifyItems: 'center' }}>
            <h2 className="title">Del barrio, para todo el país.</h2>
            <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label}</Link>
          </div>
        </section>
      </div>
    </>
  )
}
