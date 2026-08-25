/**
 * The single source of truth for available genres — used by UI components,
 * AI generators, and templates throughout the app.
 */

import { capitalize } from '@/lib/utils';
import type { GenreValue } from '@/types/genre.types';

export type { GenreValue } from '@/types/genre.types';

export interface GenreOption {
  value: GenreValue;
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
  return GENRE_LABELS[value] || capitalize(value);
}

/**
 * Normalize genre value to standard format
 * Maps common variations to canonical genre values
 */
export function normalizeGenre(value: string): string {
  // Check if it's already a valid genre
  const isValid = GENRES.some(genre => genre.value === value);
  if (isValid) {
    return value;
  }

  // Map common variations to canonical values (only for known alternate names)
  const normalized = value.toLowerCase().trim();
  const commonMappings: Record<string, string> = {
    'science fiction': 'sci-fi',
    'scifi': 'sci-fi',
    'science-fiction': 'sci-fi',
  };

  if (commonMappings[normalized]) {
    return commonMappings[normalized];
  }

  // Convert to lowercase and replace spaces with hyphens as fallback
  const converted = normalized.replace(/\s+/g, '-');

  // Return the converted/normalized value (preserves mixed genres like "cyberpunk-western")
  return converted;
}

/**
 * Coerce arbitrary input into a supported genre value.
 */
export function toGenreValue(value: string, fallback: GenreValue = 'other'): GenreValue {
  const normalized = normalizeGenre(value);
  const isValid = GENRES.some(genre => genre.value === normalized);
  return (isValid ? normalized : fallback) as GenreValue;
}
