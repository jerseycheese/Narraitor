import { useEffect } from 'react';
import type { Preview } from '@storybook/react';

import '../src/app/globals.css';
import '../src/lib/theme/themes/ds1.css';
import '../src/lib/theme/themes/ds2.css';
import '../src/lib/theme/themes/ds3.css';
import './storybook.css';

const withTheme = (Story, context) => {
  const theme = context.globals.theme || 'ds1';
  const colorScheme = context.globals.colorScheme || 'light';

  useEffect(() => {
    const doc = document.documentElement;
    doc.setAttribute('data-theme', theme);
    if (colorScheme === 'dark') {
      doc.classList.add('dark');
    } else {
      doc.classList.remove('dark');
    }
  }, [theme, colorScheme]);

  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Design system theme',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'ds1', title: 'DS1 - Drafting Table' },
          { value: 'ds2', title: 'DS2 - Warm Earth' },
          { value: 'ds3', title: 'DS3 - Mechanical Manuscript' },
        ],
        dynamicTitle: true,
      },
    },
    colorScheme: {
      name: 'Color Scheme',
      description: 'Light or dark mode',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'ds1',
    colorScheme: 'light',
  },
  decorators: [withTheme],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['00-Foundation', '*'],
      },
    },
    backgrounds: {
      default: 'theme',
      values: [
        { name: 'theme', value: 'transparent' },
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
        push: (...args: unknown[]) => {
          console.log('[Storybook] router.push called with:', args);
          return Promise.resolve(true);
        },
        replace: (...args: unknown[]) => {
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
