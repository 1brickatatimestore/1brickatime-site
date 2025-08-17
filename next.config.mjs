/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "img.bricklink.com", // BrickLink images
      "res.cloudinary.com", // If you add custom hosting later
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // prevents Vercel build errors
  },
};

export default nextConfig;