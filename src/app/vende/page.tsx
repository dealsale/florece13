import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Svg } from '@/components/Svg'
import { stairs } from '@/lib/art'
import { getCurrentUser, getStoreForUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Vendé en Florece 13',
  description: 'Abrí tu tienda de la Comuna 13 en línea y recibí pedidos de todo el país directo en tu WhatsApp.',
}

const HERO_STAIRS = stairs('rgba(255,255,255,.14)', 7, 520, 320)
const STEPS = [
  ['#E5379B', 'Creá tu cuenta', 'Tu nombre, tu correo y una clave. Dos minutos.'],
  ['#FF8A00', 'Armá tu tienda', 'Nombre, WhatsApp, tu sector de la 13, logo, portada y tu historia.'],
  ['#17BEBB', 'Subí tus productos', 'Foto, precio y descripción, desde el celular.'],
  ['#128C4B', 'Recibí pedidos', 'Te llegan a tu WhatsApp y los ves ordenados en tu panel.'],
]
const FEATS = [
  ['var(--tint-verde)', 'var(--verde)', 'whatsapp', 'Pedidos a tu WhatsApp', 'El comprador arma su pedido y te lo manda escrito. Vos acordás el pago (Nequi, transferencia, contraentrega) y el envío.'],
  ['var(--tint-fucsia)', 'var(--fucsia-t)', 'tienda', 'Tu propia tienda', 'Con tu link, tu portada, tu catálogo y tu historia. Compartila en Instagram y en tus estados.'],
  ['var(--tint-naranja)', 'var(--naranja-t)', 'qr', 'QR para tu local', 'Imprimí tu sticker “Florece aquí”: el turista lo escanea y te sigue comprando desde su casa.'],
  ['var(--tint-turquesa)', 'var(--turquesa-t)', 'escudo', 'Solo gente de la 13', 'Revisamos cada tienda antes de publicarla. El comprador sabe que le compra al barrio.'],
]
const PHOTO_TIPS = [
  ['Fondo liso', 'Un muro o una tela de un solo color. Que nada distraiga del producto.'],
  ['Luz de día', 'Cerca de una ventana o en la calle a la sombra. Sin flash.'],
  ['Una pieza por foto', 'Producto centrado. Si tiene detalles, tomale otra foto de cerca.'],
  ['Siempre real', 'Tus productos, tus manos, tu local. Nada de fotos sacadas de internet.'],
]

export default async function VendePage() {
  const user = await getCurrentUser()
  const store = user ? await getStoreForUser(user.id) : null
  const cta = store
    ? { href: '/panel', label: 'Ir a mi tienda' }
    : user
      ? { href: '/panel/crear-tienda', label: 'Crear mi tienda' }
      : { href: '/registro', label: 'Abrí tu tienda gratis' }

  return (
    <>
      <section className="v-hero">
        <div className="wrap">
          <span className="tag rise">para comerciantes de la 13</span>
          <h1 className="display rise" style={{ ['--i' as string]: 1, maxWidth: '11ch' }}>Tu negocio florece aquí.</h1>
          <p className="rise" style={{ ['--i' as string]: 2 }}>
            La vitrina en línea de los comercios de la Comuna 13. Mostrale tus productos a toda Colombia y recibí los pedidos en tu WhatsApp, como ya trabajás hoy.
          </p>
          <div className="row rise" style={{ ['--i' as string]: 3 }}>
            <Link href={cta.href} className="btn btn-light btn-lg">{cta.label} <Icon name="flecha" size={18} /></Link>
            {!user && <Link href="/entrar" className="btn btn-ghost" style={{ ['--fg' as string]: '#fff' }}>Ya tengo tienda</Link>}
          </div>
        </div>
        <div className="v-hero__art"><Svg html={HERO_STAIRS} /></div>
      </section>

      <div className="wrap">
        <section className="sec">
          <div className="sec__head"><div><span className="tag">así de fácil</span><h2 className="h2">De la terraza al país en 4 pasos</h2></div></div>
          <div className="steps">
            {STEPS.map(([c, t, d], i) => (
              <div key={t} className="step rise" style={{ ['--i' as string]: i, ['--c' as string]: c }}><b>{i + 1}</b><h3 className="h3">{t}</h3><p className="muted">{d}</p></div>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="feat">
            {FEATS.map(([c, ink, ic, t, d], i) => (
              <div key={t} className="rise" style={{ ['--i' as string]: i, ['--c' as string]: c, ['--ink' as string]: ink }}>
                <i><Icon name={ic} size={26} /></i>
                <h3 className="h3">{t}</h3>
                <p style={{ color: 'var(--tinta-2)' }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" id="fotos">
          <div className="s-story">
            <span className="tag">guía de fotos</span>
            <h2 className="h2">Tu foto es el corazón de la ficha</h2>
            <div className="feat">
              {PHOTO_TIPS.map(([t, d]) => (
                <div key={t} style={{ ['--c' as string]: 'var(--hueso)', padding: 16 }}><strong>{t}</strong><span className="muted">{d}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="cta" style={{ textAlign: 'center', justifyItems: 'center' }}>
            <span className="tag">¿listo?</span>
            <h2 className="h1">Del barrio, para todo el país.</h2>
            <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label} <Icon name="flecha" size={18} /></Link>
          </div>
        </section>
      </div>
    </>
  )
}
