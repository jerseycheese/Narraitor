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
  
  // Configure webpack for proper path resolution and CSS processing
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src')
    };

    // Find CSS rules and configure PostCSS for Tailwind v4
    const rules = config.module.rules;
    
    // Process all CSS-related rules
    rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('css')) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((loader, index) => {
            if (loader && typeof loader === 'object' && loader.loader) {
              // Configure PostCSS loader
              if (loader.loader.includes('postcss-loader')) {
                rule.use[index] = {
                  ...loader,
                  options: {
                    ...loader.options,
                    postcssOptions: {
                      plugins: {
                        '@tailwindcss/postcss': {},
                      },
                    },
                  },
                };
              }
            }
          });
        }
      }
    });

    return config;
  }
};

module.exports = config;