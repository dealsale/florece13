import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // sharp y postgres corren solo en el servidor
  serverExternalPackages: ['sharp', 'postgres'],
  images: {
    // Las fotos ya se optimizan al subirlas (WebP, máx. 1600 px)
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // El service worker siempre se revisa en la red para que las actualizaciones lleguen enseguida.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}

export default nextConfig
