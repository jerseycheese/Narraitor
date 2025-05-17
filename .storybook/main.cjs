/**
 * Storybook Configuration for Narraitor
 */
const path = require('path');

module.exports = {
  stories: [
    // Include all stories from the project
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
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