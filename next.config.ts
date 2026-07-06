import type { NextConfig } from "next";

// Content Security Policy (enforced). 'unsafe-inline' is kept for script/style
// because the app relies on inline scripts (the theme-init script in
// layout.tsx, Next.js hydration bootstrap, Vercel Analytics); dropping it would
// require per-request nonces via middleware, which opts every page out of
// static generation. Enforcement was verified clean first: a headless crawl of
// the public/creation/settings/dev routes produced zero violations, generated
// images are base64 data: URLs, and no client code fetches non-self origins.
const isDev = process.env.NODE_ENV !== 'production';

// Development-only script sources, omitted from production builds to keep the
// shipped policy strict:
// - 'unsafe-eval': `next dev` evaluates the HMR / React Fast Refresh runtime
//   with eval(); production (next build) never uses eval.
// - va.vercel-scripts.com: Vercel Analytics loads its debug script from this
//   origin in dev; in production it is served same-origin (/_vercel/insights).
// Dev-only allowance so impeccable live mode (http://localhost:8400) can load.
// Guarded by NODE_ENV; never present in production builds.
const impeccableLiveDev = isDev ? ['http://localhost:8400'] : [];
const devScriptSrc = isDev ? ["'unsafe-eval'", 'https://va.vercel-scripts.com'] : [];
const scriptSrc = ["'self'", "'unsafe-inline'", ...devScriptSrc, ...impeccableLiveDev].join(' ');

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://picsum.photos https://i.pravatar.cc https://api.dicebear.com",
  `connect-src ${["'self'", 'https://vitals.vercel-insights.com', ...impeccableLiveDev].join(' ')}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

// Hardening headers that are safe to enforce immediately.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  // React strict mode for development warnings
  reactStrictMode: true,

  // Security headers applied to every route. See securityHeaders above.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

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
