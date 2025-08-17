/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.bricklink.com" },
      { protocol: "https", hostname: "*.bricklink.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;