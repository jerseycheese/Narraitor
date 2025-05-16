/**
 * PostCSS Configuration for Storybook
 * This ensures Tailwind CSS works properly in Storybook
 */
module.exports = {
  plugins: {
    'postcss-nested': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
