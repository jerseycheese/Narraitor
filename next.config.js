/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false, // Hide development indicators for clean screenshots
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
    ],
  },
  webpack: (config) => {
    // Add path resolver
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
};

export default nextConfig;