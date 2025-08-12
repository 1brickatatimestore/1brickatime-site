// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.bricklink.com' },
      { protocol: 'https', hostname: 'i.bricklink.com' },
    ],
  },
};

export default nextConfig;