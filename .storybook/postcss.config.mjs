/**
 * PostCSS Configuration for Storybook
 * This ensures Tailwind CSS works properly in Storybook
 */
const storybookPostcssConfig = {
  plugins: {
    'postcss-nested': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

module.exports = storybookPostcssConfig;
