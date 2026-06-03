import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode for development warnings
  reactStrictMode: true,

  // Tree-shake barrel imports from icon-heavy packages so a cold start only
  // ships the icons actually used, not the full lucide-react module graph.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Keep large server-only packages out of the Next.js bundle so they're
  // required natively by Node.js rather than compiled by webpack.
  serverExternalPackages: ['@lenml/tokenizer-gemini', '@lenml/tokenizers'],

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
      // Unify the three design system pages under one URL pattern.
      // The legacy /dev/design-system-2 and /dev/design-system-3 routes
      // are kept alive only for their /session subroutes; the bare paths
      // redirect into the unified catch-all so existing links survive.
      {
        source: '/dev/design-system-2',
        destination: '/dev/design-system/2',
        permanent: false,
      },
      {
        source: '/dev/design-system-3',
        destination: '/dev/design-system/3',
        permanent: false,
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
