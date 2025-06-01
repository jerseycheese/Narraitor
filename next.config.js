/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  webpack: (config) => {
    // Add path resolver
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
};

export default nextConfig;