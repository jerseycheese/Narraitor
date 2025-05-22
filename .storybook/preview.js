/**
 * Simplified Storybook Preview Configuration
 * Without dark mode support
 */
import '../src/app/globals.css';

// Force color styles for Storybook
const styleOverrides = `
  /* Force proper colors in Storybook */
  body.sb-show-main {
    color: #171717 !important;
    background-color: #ffffff !important;
  }
    
  /* For all text inside stories */
  #storybook-root {
    color: #171717 !important;
    background-color: #ffffff !important;
  }
`;

export default {
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
  // Add style tag to force colors
  decorators: [
    (Story) => (
      <>
        <style>{styleOverrides}</style>
        <Story />
      </>
    ),
  ],
};