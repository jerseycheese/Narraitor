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
    border: primitiveColors.amber[700],
  },
  mysterious: {
    background: primitiveColors.gray[700], // #374151
    foreground: primitiveColors.white,
    border: primitiveColors.gray[500],
  },
  tragic: {
    background: primitiveColors.red[500], // #ef4444
    foreground: primitiveColors.white,
    border: primitiveColors.red[700],
  },
  hopeful: {
    background: primitiveColors.green[500], // #22c55e
    foreground: primitiveColors.white,
    border: primitiveColors.green[700],
  },
} as const

// Lore category colors for content organization
export const loreCategories = {
  characters: {
    background: primitiveColors.blue[100],
    border: primitiveColors.blue[300],
    text: primitiveColors.blue[900],
  },
  locations: {
    background: primitiveColors.green[200],
    border: primitiveColors.green[500],
    text: primitiveColors.green[700],
  },
  events: {
    background: primitiveColors.blue[100], // Using our blue system
    border: primitiveColors.blue[300], // Blue border
    text: primitiveColors.blue[900], // Dark blue text
  },
  rules: {
    background: primitiveColors.amber[200],
    border: primitiveColors.amber[500],
    text: primitiveColors.amber[700],
  },
} as const

// Portrait generation theme colors (used in AI generation)
export const portraitThemes = {
  warm: {
    primary: primitiveColors.amber[700], // #b45309
    secondary: primitiveColors.amber[500], // #f59e0b
    accent: primitiveColors.amber[200], // #fde68a
  },
  cool: {
    primary: primitiveColors.blue[700],
    secondary: primitiveColors.blue[500],
    accent: primitiveColors.blue[300],
  },
  neutral: {
    primary: primitiveColors.gray[700],
    secondary: primitiveColors.gray[500],
    accent: primitiveColors.gray[300],
  },
  vibrant: {
    primary: primitiveColors.red[700], // #b91c1c
    secondary: primitiveColors.amber[500], // #f59e0b
    accent: primitiveColors.red[500], // Using red instead of violet
  },
} as const

export type EndingTones = typeof endingTones
export type LoreCategories = typeof loreCategories
export type PortraitThemes = typeof portraitThemes