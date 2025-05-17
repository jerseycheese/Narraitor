/**
 * PostCSS Configuration for Storybook
 * This ensures Tailwind CSS works properly in Storybook
 */
const storybookPostcssConfig = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};

module.exports = storybookPostcssConfig;
