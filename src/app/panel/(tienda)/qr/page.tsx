import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { LogoMark } from '@/components/Logo'
import { PrintButton } from '@/components/panel/PrintButton'
import { requireMerchant } from '@/lib/auth'
import { appUrl } from '@/lib/url'

export const metadata: Metadata = { title: 'QR y sticker' }

export default async function QrPage() {
  const { store } = await requireMerchant('/panel/qr')
  const url = appUrl(`/t/${store.slug}`)
  const qr = await QRCode.toDataURL(url, { width: 720, margin: 1, color: { dark: '#222222', light: '#FFFFFF' }, errorCorrectionLevel: 'M' })

  return (
    <div className="stack" style={{ ['--gap' as string]: '20px' }}>
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <h1 className="title">QR y sticker</h1>
      </div>
      <p className="lede">Pegalo en tu local, en tus bolsas o en tu tarjeta. Quien lo escanee llega directo a tu tienda.</p>

      <div className="qr-box printable">
        <div className="row" style={{ justifyContent: 'center', ['--gap' as string]: '8px' }}>
          <LogoMark size={36} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>Florece aquí</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={`Código QR de ${store.name}`} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{store.name}</div>
          <div className="small muted" style={{ wordBreak: 'break-all' }}>{url.replace(/^https?:\/\//, '')}</div>
        </div>
        <div className="mural-band" style={{ width: '100%' }} aria-hidden="true" />
      </div>

      <div className="row">
        <a href={qr} download={`florece13-${store.slug}-qr.png`} className="btn btn-primary">Descargar QR</a>
        <PrintButton />
      </div>
    </div>
  )
}
