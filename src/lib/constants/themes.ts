/**
 * Centralized theme/genre constants for the Narraitor application
 * 
 * This file serves as the single source of truth for all available themes/genres
 * used throughout the application, including UI components, AI generators, and templates.
 */

export interface ThemeOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Complete list of supported themes with their display labels
 */
export const THEMES: ThemeOption[] = [
  { value: 'fantasy', label: 'Fantasy', description: 'Magical worlds with mythical creatures and supernatural elements' },
  { value: 'sci-fi', label: 'Sci-Fi', description: 'Science fiction with futuristic technology and space exploration' },
  { value: 'modern', label: 'Modern', description: 'Contemporary settings and realistic scenarios' },
  { value: 'historical', label: 'Historical', description: 'Past time periods with authentic cultural details' },
  { value: 'horror', label: 'Horror', description: 'Dark, frightening scenarios with supernatural or psychological terror' },
  { value: 'mystery', label: 'Mystery', description: 'Investigation and puzzle-solving narratives' },
  { value: 'western', label: 'Western', description: 'American frontier and cowboy adventures' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'High-tech dystopian futures with corporate control' },
  { value: 'other', label: 'Other', description: 'Custom or unique themes not covered by standard categories' },
];

/**
 * Theme values as a union type for TypeScript type safety
 */
export type ThemeValue = typeof THEMES[number]['value'];

/**
 * Map of theme values to their display labels for quick lookup
 */
export const THEME_LABELS: Record<string, string> = THEMES.reduce(
  (acc, theme) => ({ ...acc, [theme.value]: theme.label }),
  {}
);

/**
 * Get theme label by value
 */
export function getThemeLabel(value: string): string {
  return THEME_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Check if a theme value is valid
 */
export function isValidTheme(value: string): value is ThemeValue {
  return THEMES.some(theme => theme.value === value);
}

/**
 * Legacy theme mappings for backward compatibility
 */
export const LEGACY_THEME_MAPPING: Record<string, string> = {
  'Fantasy': 'fantasy',
  'Sci-Fi': 'sci-fi',
  'Science Fiction': 'sci-fi',
  'Horror': 'horror',
  'Western': 'western',
  'Comedy': 'comedy',
  'modern': 'modern',
  'Historical': 'historical',
  'Post-Apocalyptic': 'post-apocalyptic',
  'Cyberpunk': 'cyberpunk',
};

/**
 * Normalize theme value to standard format
 */
export function normalizeTheme(value: string): string {
  // Check if it's already a valid theme
  if (isValidTheme(value)) {
    return value;
  }
  
  // Check legacy mappings
  if (LEGACY_THEME_MAPPING[value]) {
    return LEGACY_THEME_MAPPING[value];
  }
  
  // Convert to lowercase and replace spaces with hyphens
  return value.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Themes commonly used for AI image generation
 */
export const AI_SUPPORTED_THEMES = THEMES.map(theme => theme.value);

/**
 * Default theme for new worlds
 */
export const DEFAULT_THEME: ThemeValue = 'fantasy';