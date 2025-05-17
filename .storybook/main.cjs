/**
 * Storybook Configuration for Narraitor
 * 
 * Minimal configuration focused on the GlobalStylesDemo component.
 */
const path = require('path');

module.exports = {
  stories: [
    // Only include the GlobalStylesDemo story to avoid dependency issues
    '../src/components/design-system/GlobalStylesDemo.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  staticDirs: ['../public'],
  
  // Configure webpack for proper path resolution
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src')
    };
    return config;
  }
};