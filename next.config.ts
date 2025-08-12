import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.bricklink.com' },
      { protocol: 'https', hostname: 'static.bricklink.com' },
    ],
  },
}

export default nextConfig