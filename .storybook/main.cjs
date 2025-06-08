/**
 * Storybook Configuration for Narraitor
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const config = {
  stories: [
    // Include all stories from the project
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/**/*.mdx'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: path.resolve(__dirname, '../next.config.ts'),
    }
  },
  staticDirs: ['../public'],
  
  // Configure webpack for proper path resolution and Tailwind v4 PostCSS
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src')
    };

    // Find CSS rule and configure PostCSS for Tailwind v4
    const cssRule = config.module.rules.find(rule => 
      rule.test && rule.test.toString().includes('css')
    );

    if (cssRule && cssRule.use) {
      cssRule.use.forEach((loader, index) => {
        if (loader && loader.loader && loader.loader.includes('postcss-loader')) {
          cssRule.use[index] = {
            ...loader,
            options: {
              postcssOptions: {
                plugins: [
                  ['@tailwindcss/postcss', {}],
                ],
              },
            },
          };
        }
      });
    }

    return config;
  }
};

module.exports = config;