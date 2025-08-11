/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.bricklink.com' },
      // add others if you ever need them
    ],
    // while stabilizing you can also turn off optimization:
    // unoptimized: true,
  },
}

module.exports = nextConfig