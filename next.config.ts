import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // sharp y postgres corren solo en el servidor
  serverExternalPackages: ['sharp', 'postgres'],
  images: {
    // Las fotos ya se optimizan al subirlas (WebP, máx. 1600 px)
    unoptimized: true,
  },
}

export default nextConfig
