// frontend/next.config.js
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bricklink.com',
      },
      {
        protocol: 'https',
        hostname: '**.brickset.com',
      },
    ],
  },
  webpack: (config) => {
    // Fix @ alias
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

export default nextConfig;
