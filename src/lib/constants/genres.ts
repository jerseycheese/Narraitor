// src/lib/constants/genres.ts

/**
 * Available genres for world creation and template generation
 */
export const AVAILABLE_GENRES = [
  'Fantasy',
  'Sci-Fi', 
  'Horror',
  'Western',
  'Cyberpunk',
  'Steampunk',
  'Post-Apocalyptic',
  'Modern',
  'Historical',
  'Comedy',
  'Mystery',
  'Romance',
  'Adventure',
  'Thriller'
] as const;

export type Genre = typeof AVAILABLE_GENRES[number];

/**
 * Genre categories for better organization
 */
export const GENRE_CATEGORIES = {
  'Speculative Fiction': ['Fantasy', 'Sci-Fi', 'Cyberpunk', 'Steampunk', 'Post-Apocalyptic'],
  'Historical': ['Western', 'Historical'],
  'Contemporary': ['Modern', 'Thriller', 'Mystery'],
  'Atmospheric': ['Horror', 'Comedy', 'Romance', 'Adventure']
} as const;