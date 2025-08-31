/**
 * Contextual Design Tokens
 * Genre-specific colors for storytelling features
 * These are used only in specific contexts related to narrative content
 */

import { primitiveColors } from './primitives'

// Story ending tone colors (genre-specific)
export const endingTones = {
  triumphant: {
    background: primitiveColors.amber[500], // #f59e0b
    foreground: primitiveColors.white,
    border: primitiveColors.amber[600],
  },
  bittersweet: {
    background: '#8b5cf6', // violet-500
    foreground: primitiveColors.white,
    border: '#7c3aed', // violet-600
  },
  mysterious: {
    background: primitiveColors.gray[700], // #374151
    foreground: primitiveColors.white,
    border: primitiveColors.gray[600],
  },
  tragic: {
    background: primitiveColors.red[800], // #991b1b
    foreground: primitiveColors.white,
    border: primitiveColors.red[700],
  },
  hopeful: {
    background: primitiveColors.green[500], // #10b981 -> emerald-500
    foreground: primitiveColors.white,
    border: primitiveColors.green[600],
  },
} as const

// Lore category colors for content organization
export const loreCategories = {
  characters: {
    background: primitiveColors.blue[50],
    border: primitiveColors.blue[200],
    text: primitiveColors.blue[800],
  },
  locations: {
    background: primitiveColors.green[50],
    border: primitiveColors.green[200],
    text: primitiveColors.green[800],
  },
  events: {
    background: '#faf5ff', // purple-50
    border: '#e9d5ff', // purple-200
    text: '#6b21a8', // purple-800
  },
  rules: {
    background: primitiveColors.amber[50],
    border: primitiveColors.amber[200],
    text: primitiveColors.amber[800],
  },
} as const

// Portrait generation theme colors (used in AI generation)
export const portraitThemes = {
  warm: {
    primary: '#d97706', // amber-600
    secondary: '#f59e0b', // amber-500
    accent: '#fbbf24', // amber-400
  },
  cool: {
    primary: primitiveColors.blue[600],
    secondary: primitiveColors.blue[500],
    accent: primitiveColors.blue[400],
  },
  neutral: {
    primary: primitiveColors.gray[600],
    secondary: primitiveColors.gray[500],
    accent: primitiveColors.gray[400],
  },
  vibrant: {
    primary: '#dc2626', // red-600
    secondary: '#f59e0b', // amber-500
    accent: '#8b5cf6', // violet-500
  },
} as const

export type EndingTones = typeof endingTones
export type LoreCategories = typeof loreCategories
export type PortraitThemes = typeof portraitThemes