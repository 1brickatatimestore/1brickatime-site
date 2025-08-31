// frontend/next.config.js

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.bricklink.com",
      },
      {
        protocol: "https",
        hostname: "**.brickset.com",
      },
    ],
  },
  webpack: (config) => {
    // Fix @ alias
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
