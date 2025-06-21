/**
 * Centralized genre constants for the Narraitor application
 * 
 * This file serves as the single source of truth for all available genres
 * used throughout the application, including UI components, AI generators, and templates.
 */

export interface GenreOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Complete list of supported genres with their display labels
 */
export const GENRES: GenreOption[] = [
  { value: 'fantasy', label: 'Fantasy', description: 'Magical worlds with mythical creatures and supernatural elements' },
  { value: 'sci-fi', label: 'Sci-Fi', description: 'Science fiction with futuristic technology and space exploration' },
  { value: 'modern', label: 'Modern', description: 'Contemporary settings and realistic scenarios' },
  { value: 'historical', label: 'Historical', description: 'Past time periods with authentic cultural details' },
  { value: 'horror', label: 'Horror', description: 'Dark, frightening scenarios with supernatural or psychological terror' },
  { value: 'mystery', label: 'Mystery', description: 'Investigation and puzzle-solving narratives' },
  { value: 'western', label: 'Western', description: 'American frontier and cowboy adventures' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'High-tech dystopian futures with corporate control' },
  { value: 'other', label: 'Other', description: 'Custom or unique genres not covered by standard categories' },
];

/**
 * Genre values as a union type for TypeScript type safety
 */
export type GenreValue = typeof GENRES[number]['value'];

/**
 * Map of genre values to their display labels for quick lookup
 */
export const GENRE_LABELS: Record<string, string> = GENRES.reduce(
  (acc, genre) => ({ ...acc, [genre.value]: genre.label }),
  {}
);

/**
 * Get genre label by value
 */
export function getGenreLabel(value: string): string {
  return GENRE_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Check if a genre value is valid
 */
export function isValidGenre(value: string): value is GenreValue {
  return GENRES.some(genre => genre.value === value);
}

/**
 * Legacy genre mappings for backward compatibility with old theme naming
 */
export const LEGACY_GENRE_MAPPING: Record<string, string> = {
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
 * Normalize genre value to standard format
 */
export function normalizeGenre(value: string): string {
  // Check if it's already a valid genre
  const isValid = GENRES.some(genre => genre.value === value);
  if (isValid) {
    return value;
  }
  
  // Check legacy mappings
  const legacyMapping = LEGACY_GENRE_MAPPING[value];
  if (legacyMapping) {
    return legacyMapping;
  }
  
  // Convert to lowercase and replace spaces with hyphens
  return value.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Genres commonly used for AI image generation
 */
export const AI_SUPPORTED_GENRES = GENRES.map(genre => genre.value);

/**
 * Default genre for new worlds
 */
export const DEFAULT_GENRE: GenreValue = 'fantasy';

// Note: Removed legacy theme exports - applications should use genre terminology directly