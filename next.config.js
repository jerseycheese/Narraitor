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
  async rewrites() {
    return [
      // Serve Storybook from /storybook path (files are copied to public/storybook during build)
      {
        source: '/storybook',
        destination: '/storybook/index.html',
      },
      {
        source: '/storybook/:path*',
        destination: '/storybook/:path*',
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
  },
  // Include storybook-static directory in the build output
  async headers() {
    return [
      {
        source: '/storybook/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  }
};

export default nextConfig;