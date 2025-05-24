/**
 * Storybook Configuration for Narraitor
 */
import path from 'path';

const config = {
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

export default config;