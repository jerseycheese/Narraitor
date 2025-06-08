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
    console.log('STORYBOOK WEBPACK FINAL CALLED');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src')
    };

    // Find and explicitly configure CSS processing
    const cssRules = config.module.rules.filter(rule => 
      rule.test && (rule.test.toString().includes('css') || rule.test.toString().includes('\\.css'))
    );
    
    console.log('Found CSS rules:', cssRules.length);
    
    cssRules.forEach((rule, ruleIndex) => {
      console.log(`CSS Rule ${ruleIndex}:`, rule.test.toString());
      
      if (rule.use && Array.isArray(rule.use)) {
        rule.use.forEach((loader, loaderIndex) => {
          if (loader && typeof loader === 'object' && loader.loader && loader.loader.includes('postcss-loader')) {
            console.log('Found PostCSS loader, configuring...');
            rule.use[loaderIndex] = {
              ...loader,
              options: {
                ...loader.options,
                postcssOptions: {
                  plugins: [
                    require('@tailwindcss/postcss')
                  ],
                },
              },
            };
            console.log('PostCSS loader configured with Tailwind');
          }
        });
      }
    });

    return config;
  }
};

module.exports = config;