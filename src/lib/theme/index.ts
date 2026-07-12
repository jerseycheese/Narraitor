export type DesignSystem = 'ds3';
export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeMetadata {
  id: DesignSystem;
  name: string;
  description: string;
}

export const THEMES: ThemeMetadata[] = [
  { id: 'ds3', name: 'Mechanical Manuscript', description: 'Aged paper, drafting ink, dot grid' },
];

export const DEFAULT_THEME: DesignSystem = 'ds3';
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'light';

export const STORAGE_KEY_THEME = 'narraitor-theme';
export const STORAGE_KEY_COLOR_SCHEME = 'narraitor-color-scheme';

export { ThemeProvider, useTheme } from './ThemeProvider';
