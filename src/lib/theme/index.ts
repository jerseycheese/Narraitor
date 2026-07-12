export type DesignSystem = 'ds3';
export type ColorScheme = 'light' | 'dark' | 'system';

export const DEFAULT_THEME: DesignSystem = 'ds3';
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'light';

export const STORAGE_KEY_COLOR_SCHEME = 'narraitor-color-scheme';

export { ThemeProvider, useTheme } from './ThemeProvider';
