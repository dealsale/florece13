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
import { INSTALL_EARLY_SCRIPT, InstallBanner, InstallProvider } from '@/components/InstallApp'
import { TabBar } from '@/components/TabBar'
import { getCurrentUser, getStoreForUser } from '@/lib/auth'
import { splashStartupImages } from '@/lib/pwa'
import { appUrl } from '@/lib/url'

// Todo el contenido sale de la base de datos y de la sesión: se renderiza en cada request.
export const dynamic = 'force-dynamic'

const DESCRIPTION =
  'La vitrina digital de los comercios de la Comuna 13 de Medellín: artesanías, ropa, arte, recuerdos y sabores del barrio, directo de quienes los hacen. Pedí por WhatsApp y recibí en todo Colombia.'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: 'Florece 13 · Del barrio, para todo el país', template: '%s · Florece 13' },
  description: DESCRIPTION,
  applicationName: 'Florece 13',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/favicon-96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
  },
  keywords: ['Comuna 13', 'Medellín', 'artesanías', 'hecho a mano', 'tienda en línea', 'emprendedores', 'recuerdos de Medellín', 'streetwear', 'marketplace Colombia'],
  alternates: { canonical: '/' },
  appleWebApp: { capable: true, title: 'Florece 13', statusBarStyle: 'default', startupImage: splashStartupImages },
  // iOS todavía la usa para abrir a pantalla completa y mostrar las imágenes de arranque.
  other: { 'apple-mobile-web-app-capable': 'yes' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Florece 13',
    locale: 'es_CO',
    url: '/',
    title: 'Florece 13 · Del barrio, para todo el país',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Florece 13 · Del barrio, para todo el país',
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F3EE',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const account = !user ? 'none' : user.role === 'ADMIN' ? 'admin' : user.role === 'CUSTOMER' && !(await getStoreForUser(user.id)) ? 'customer' : 'merchant'
  return (
    <html lang="es-CO">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_EARLY_SCRIPT }} />
      </head>
      <body>
        <InstallProvider>
          <CartProvider>
            <Header />
            <InstallBanner />
            <main>{children}</main>
            <Footer />
            <TabBar account={account} />
          </CartProvider>
        </InstallProvider>
      </body>
    </html>
  )
}
