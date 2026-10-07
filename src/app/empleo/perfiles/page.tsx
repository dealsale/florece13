import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { listTalentForBusiness } from '@/lib/actions/talent'
import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Perfiles · Busco trabajo', robots: { index: false } }

/** Perfiles de gente del barrio que busca trabajo. Solo para negocios registrados. */
export default async function PerfilesPage() {
  if (!(await getCurrentUser())) redirect('/entrar?next=%2Fempleo%2Fperfiles')
  const list = await listTalentForBusiness()
  if (!list) {
    return (
      <div className="wrap sec">
        <EmptyState title="Esta sección es para negocios." text="Los perfiles los ven solo los negocios registrados en Florece 13.">
          <Link href="/vende" className="btn btn-primary">Registrá tu negocio</Link>
        </EmptyState>
      </div>
    )
  }
  return (
    <div className="wrap">
      <section className="stack" style={{ paddingTop: 28, ['--gap' as string]: '8px' }}>
        <Link href="/empleo" className="small" style={{ fontWeight: 700 }}>← Oportunidades</Link>
        <h1 className="h1">Gente que busca trabajo</h1>
        <p className="lede">Del barrio, listos para trabajar. Escribiles directo.</p>
      </section>
      <section className="sec" style={{ paddingTop: 12 }}>
        {list.length === 0 ? (
          <EmptyState title="Todavía no hay perfiles." text="Cuando alguien publique el suyo, aparece aquí." />
        ) : (
          <div className="grid-jobs">
            {list.map((t) => (
              <article key={t.id} className="job">
                <div className="job__h">
                  <span className="talent__av">{t.name.slice(0, 1).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="job__t">{t.trade}</h3>
                    <span className="small muted">{t.name}</span>
                  </div>
                </div>
                <div className="job__m">
                  <span className="chip"><Icon name="ubicacion" size={13} /> {t.sector || 'Comuna 13'}</span>
                  {t.availability && <span className="chip"><Icon name="reloj" size={13} /> {t.availability}</span>}
                  <span className="chip">Desde {formatDate(t.createdAt).split(',')[0]}</span>
                </div>
                {t.about && <p className="small" style={{ margin: 0 }}>{t.about}</p>}
                <a className="btn btn-wa btn-sm" href={waLink(t.whatsapp, `¡Hola, ${t.name.split(' ')[0]}! Vi tu perfil en Florece 13 (${t.trade}). Tenemos una oportunidad que te puede interesar.`)} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={16} /> Escribir por WhatsApp
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
