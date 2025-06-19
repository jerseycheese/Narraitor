import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router is enabled by default in Next.js 13+
  // No specific configuration needed for basic App Router usage
  
  // ESLint and TypeScript checks are enabled
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Optional: You can add experimental features if needed
  // experimental: {
  //   serverActions: true,
  // },
};

export default nextConfig;
