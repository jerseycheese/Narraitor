/**
 * Storybook Configuration for Narraitor
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const config = {
  stories: [
    // Include all stories from the atomic design structure
    '../src/stories/**/*.stories.@(js|jsx|ts|tsx)'
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
  staticDirs: [
    { from: '../public', to: '/' }
  ],
  
  // Configure webpack for proper path resolution
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
      // Same swap as next.config.ts's webpack() hook: the Gemini tokenizer's
      // BPE vocabulary is 11 MB and every story that reaches
      // baseNarrativeTemplate pulls it in. @storybook/nextjs reads
      // next.config.ts but never calls its webpack() hook, so the alias has to
      // be repeated here. Storybook is browser-only, so there's no isServer
      // branch to mirror.
      '@lenml/tokenizer-gemini': path.resolve(
        __dirname,
        '../src/lib/promptContext/geminiTokenizerBrowserStub.ts'
      )
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