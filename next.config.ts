import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode for development warnings
  reactStrictMode: true,

  // ESLint and TypeScript checks are enabled
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Hide development indicators for clean screenshots
  devIndicators: false,

  // Redirects for old dev paths
  async redirects() {
    return [
      // Redirect old dev paths to new ones
      {
        source: '/app/dev',
        destination: '/dev',
        permanent: true,
      },
      {
        source: '/app/dev/:path*',
        destination: '/dev/:path*',
        permanent: true,
      },
    ];
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
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Webpack configuration
  webpack: (config) => {
    // Add path resolver fallback for client-side builds
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
