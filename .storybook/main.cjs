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
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        rules: [
          {
            test: /\.css$/,
            sideEffects: true,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                },
              },
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  postcssOptions: {
                    config: path.resolve(__dirname, '../postcss.config.mjs'),
                  },
                },
              },
            ],
          },
        ],
      },
    }
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: path.resolve(__dirname, '../next.config.ts'),
    }
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

module.exports = config;