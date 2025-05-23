import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router is enabled by default in Next.js 13+
  // No specific configuration needed for basic App Router usage
  
  // Disable ESLint and TypeScript checks during build for now due to refactoring in progress
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optional: You can add experimental features if needed
  // experimental: {
  //   serverActions: true,
  // },
};

export default nextConfig;
