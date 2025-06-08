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

    // Find and configure PostCSS loader for Tailwind v4
    const rules = config.module.rules;
    
    // Look for CSS rule
    const cssRule = rules.find(rule => 
      rule.test && rule.test.toString().includes('css')
    );
    
    if (cssRule && cssRule.use) {
      // Find PostCSS loader and ensure it uses our config
      cssRule.use.forEach((loader, index) => {
        if (loader && typeof loader === 'object' && loader.loader && loader.loader.includes('postcss-loader')) {
          cssRule.use[index] = {
            ...loader,
            options: {
              ...loader.options,
              postcssOptions: {
                config: path.resolve(__dirname, '../postcss.config.mjs'),
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