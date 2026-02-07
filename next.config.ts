import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile ESM packages
  transpilePackages: ['@react-pdf/renderer'],
  
  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep errors and warnings
    } : false,
  },
  
  // Configure webpack for ESM packages
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
