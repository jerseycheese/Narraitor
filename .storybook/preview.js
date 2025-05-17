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
  
  /* Force all elements to use proper color */
  h1, h2, h3, h4, h5, h6, p, li, td, th, label, div {
    color: #171717 !important;
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