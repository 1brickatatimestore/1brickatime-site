/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "img.bricklink.com" },
      { protocol: "https", hostname: "static.bricklink.com" },
      { protocol: "https", hostname: "www.bricklink.com" },
      { protocol: "https", hostname: "via.placeholder.co" },
    ],
  },
  async redirects() {
    return [
      { source: "/minifigures", destination: "/minifigs", permanent: false },
    ];
  },
};
module.exports = nextConfig;
