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

  // Configure for proper Vercel deployment at /storybook path
  managerHead: (head) => `
    ${head}
    <base href="/storybook/">
  `,

  core: {
    disableTelemetry: true
  },

  // Set the public path for assets when served from /storybook/
  managerWebpack: (config) => {
    config.output.publicPath = '/storybook/';
    return config;
  }
};

module.exports = config;