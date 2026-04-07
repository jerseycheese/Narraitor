import React, { useEffect } from 'react';
import type { Preview } from '@storybook/react';
import {
  Lora,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Crimson_Pro,
  JetBrains_Mono,
  Manrope,
  Newsreader,
  Fira_Code,
  DM_Sans,
} from 'next/font/google';
import { ThemeProvider, useTheme } from '../src/lib/theme/ThemeProvider';
import type { DesignSystem, ColorScheme } from '../src/lib/theme';

import '../src/app/globals.css';
import '../src/lib/theme/themes/ds1.css';
import '../src/lib/theme/themes/ds2.css';
import '../src/lib/theme/themes/ds3.css';
import './storybook.css';

// Mirror the font declarations from src/app/layout.tsx so Storybook's
// @storybook/nextjs framework loads them and injects the CSS variables
// that theme CSS references (e.g. --font-narrative: var(--font-lora)).
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-ibm-plex-mono', display: 'swap' });
const ibmPlexSans = IBM_Plex_Sans({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-ibm-plex-sans', display: 'swap' });
const crimsonPro = Crimson_Pro({ subsets: ['latin'], variable: '--font-crimson-pro', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', display: 'swap' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

const fontVariables = [
  lora.variable, ibmPlexMono.variable, ibmPlexSans.variable,
  crimsonPro.variable, jetbrainsMono.variable, manrope.variable,
  newsreader.variable, firaCode.variable, dmSans.variable,
].join(' ');

// Syncs Storybook toolbar selections into ThemeProvider's React context
// so components using useTheme() render the correct theme variant.
const ThemeSyncer: React.FC<{ sbTheme: DesignSystem; sbColorScheme: ColorScheme }> = ({
  sbTheme,
  sbColorScheme,
}) => {
  const { setTheme, setColorScheme } = useTheme();
  useEffect(() => { setTheme(sbTheme); }, [sbTheme, setTheme]);
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
  const theme = (context.globals.theme || 'ds1') as DesignSystem;
  const colorScheme = (context.globals.colorScheme || 'light') as ColorScheme;

  return (
    <ThemeProvider>
      <FontInjector />
      <ThemeSyncer sbTheme={theme} sbColorScheme={colorScheme} />
      <Story />
    </ThemeProvider>
  );
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
