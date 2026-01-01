import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep errors and warnings
    } : false,
  },
};

export default nextConfig;
