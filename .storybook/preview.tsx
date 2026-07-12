import React, { useEffect } from 'react';
import type { Preview } from '@storybook/react';
import {
  Newsreader,
  Fira_Code,
  DM_Sans,
} from 'next/font/google';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { ThemeProvider, useTheme } from '../src/lib/theme/ThemeProvider';
import type { ColorScheme } from '../src/lib/theme';
import { TutorialProvider } from '../src/components/TutorialProvider/TutorialProvider';
import { handlers } from './msw/handlers';

import '../src/app/globals.css';
import '../src/app/workshop.css';
import '../src/app/wizard.css';
import '../src/app/dashboard.css';
import '../src/app/badge.css';
import '../src/lib/theme/themes/_shared-tokens.css';
import '../src/lib/theme/themes/ds3.css';
import './storybook.css';

// Mirror the font declarations from src/app/layout.tsx so Storybook's
// @storybook/nextjs framework loads them and injects the CSS variables
// that theme CSS references (e.g. --font-narrative: var(--font-newsreader)).
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', display: 'swap', preload: true });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code', display: 'swap', preload: true });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', preload: true });

const fontVariables = [
  newsreader.variable, firaCode.variable, dmSans.variable,
].join(' ');

// Start the MSW service worker once. `onUnhandledRequest: 'bypass'` lets
// fonts/static assets through while the default handlers (./msw/handlers)
// intercept the app's AI/HTTP routes, so stories never hit the real network.
initialize({ onUnhandledRequest: 'bypass' });

// Pins data-theme="ds3" on the preview root — layout.tsx sets this via SSR
// for the real app, but Storybook's iframe never runs that layout — and
// syncs the colorScheme toolbar global into ThemeProvider's React context
// so useTheme() consumers render the right light/dark variant.
const ThemeRootSync: React.FC<{ sbColorScheme: ColorScheme }> = ({ sbColorScheme }) => {
  const { setColorScheme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = 'ds3';
  }, []);
  useEffect(() => { setColorScheme(sbColorScheme); }, [sbColorScheme, setColorScheme]);
  return null;
};

// Applies font CSS variable classes to the document root once.
const FontInjector: React.FC = () => {
  useEffect(() => {
    fontVariables.split(' ').forEach(cls => cls && document.documentElement.classList.add(cls));
  }, []);
  return null;
};

const withTheme = (Story: React.FC, context: { globals: Record<string, string> }) => {
  const colorScheme = (context.globals.colorScheme || 'light') as ColorScheme;

  return (
    <ThemeProvider>
      <FontInjector />
      <ThemeRootSync sbColorScheme={colorScheme} />
      <TutorialProvider>
        <Story />
      </TutorialProvider>
    </ThemeProvider>
  );
};

const preview: Preview = {
  globalTypes: {
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
    colorScheme: 'light',
  },
  decorators: [withTheme],
  loaders: [mswLoader],
  parameters: {
    msw: { handlers },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile (375)', styles: { width: '375px', height: '720px' } },
        tablet: { name: 'Tablet (768)', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop (1280)', styles: { width: '1280px', height: '900px' } },
      },
    },
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
