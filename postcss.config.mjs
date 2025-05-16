/**
 * PostCSS Configuration
 * This is for Tailwind CSS v4 compatibility with Next.js App Router
 */
export default {
  plugins: {
    // Tailwind CSS v4 doesn't have a separate nesting plugin anymore
    // Using postcss-nested instead for nesting functionality
    'postcss-nested': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
