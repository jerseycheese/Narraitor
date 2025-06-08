/**
 * Simplified Storybook Preview Configuration
 * Without dark mode support
 */
import '../src/app/globals.css';
import './storybook.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
      ],
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
        push: (...args) => {
          console.log('[Storybook] router.push called with:', args);
          return Promise.resolve(true);
        },
        replace: (...args) => {
          console.log('[Storybook] router.replace called with:', args);
          return Promise.resolve(true);
        },
        back: () => {
          console.log('[Storybook] router.back called');
        },
      },
    },
  },
};

export default preview;