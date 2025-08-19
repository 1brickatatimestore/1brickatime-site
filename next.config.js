// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don’t fail the build on ESLint problems
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don’t fail the build on TS type errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.bricklink.com" },
      { protocol: "https", hostname: "www.bricklink.com" },
      { protocol: "https", hostname: "static.bricklink.com" },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;