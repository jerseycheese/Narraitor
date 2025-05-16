import type { Preview } from '@storybook/react'
import '../src/app/globals.css'; // Import the globals.css file to make Tailwind styles available
import './storybook.css'; // Import Storybook-specific CSS

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;