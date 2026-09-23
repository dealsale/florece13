import '@fontsource/archivo/400.css'
import '@fontsource/archivo/500.css'
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/700.css'
import '@fontsource/archivo/800.css'
import '@fontsource/permanent-marker/400.css'
import '@fontsource/archivo-black/400.css'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { CartProvider } from '@/components/cart'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { TabBar } from '@/components/TabBar'
import { getCurrentUser } from '@/lib/auth'
import { appUrl } from '@/lib/url'

// Todo el contenido sale de la base de datos y de la sesión: se renderiza en cada request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: 'Florece 13 · La Comuna 13, en línea', template: '%s · Florece 13' },
  description:
    'La vitrina digital de los comercios de la Comuna 13 de Medellín. Artesanías, ropa, arte, comida y más, directo de quienes lo hacen.',
  applicationName: 'Florece 13',
  appleWebApp: { capable: true, title: 'Florece 13', statusBarStyle: 'default' },
  openGraph: { siteName: 'Florece 13', locale: 'es_CO', type: 'website' },
}

export const viewport: Viewport = {
  themeColor: '#F7F3EE',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="es-CO">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <TabBar loggedIn={Boolean(user)} />
        </CartProvider>
      </body>
    </html>
  )
}
