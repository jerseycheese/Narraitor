/**
 * Storybook Configuration for Narraitor
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const config = {
  stories: [
    // Include all stories from the atomic design structure
    '../src/stories/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/stories/**/*.mdx'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-styling-webpack'
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: path.resolve(__dirname, '../next.config.js'),
    }
  },
  staticDirs: [
    { from: '../public', to: '/' }
  ],
  
  // Configure webpack for proper path resolution
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src')
    };
    return config;
  },

  // Configure for proper Vercel deployment at /storybook path (only in production)
  managerHead: (head) => {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return `
        ${head}
        <base href="/storybook/">
      `;
    }
    return head;
  },

  core: {
    disableTelemetry: true
  },

  // Set the public path for assets when served from /storybook/ (only in production)
  managerWebpack: (config) => {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      config.output.publicPath = '/storybook/';
    }
    return config;
  }
};

module.exports = config;