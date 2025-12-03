/**
 * Primitive Design Tokens
 * Raw color values - genre-neutral foundation colors
 * These should not be used directly in components
 */

export const primitiveColors = {
  // Core neutral palette
  white: '#ffffff',
  black: '#000000',
  
  // Gray scale - essential shades for UI elements
  gray: {
    100: '#f3f4f6',   // Light backgrounds, subtle borders
    300: '#d1d5db',   // Borders, dividers
    500: '#6b7280',   // Secondary text, placeholders
    700: '#374151',   // Primary text on light backgrounds
    900: '#111827',   // Dark text, dark mode backgrounds
  },
  
  // Blue - primary brand color
  blue: {
    50: '#eff6ff',    // Very light info backgrounds
    100: '#dbeafe',   // Light accent backgrounds
    300: '#93c5fd',   // Hover states, light buttons
    500: '#3b82f6',   // Primary actions, links
    700: '#1d4ed8',   // Active states, pressed buttons
    900: '#1e3a8a',   // Dark accent text
  },

  // Green - success states
  green: {
    50: '#f0fdf4',    // Very light success backgrounds
    200: '#bbf7d0',   // Success background
    500: '#22c55e',   // Success text, icons
    700: '#15803d',   // Dark success text
    900: '#14532d',   // Very dark success text
  },

  // Red - danger/error states
  red: {
    50: '#fef2f2',    // Very light error backgrounds
    200: '#fecaca',   // Error background
    500: '#ef4444',   // Error text, icons
    700: '#b91c1c',   // Dark error text
    900: '#7f1d1d',   // Very dark error text
  },

  // Amber - warning states
  amber: {
    50: '#fffbeb',    // Very light warning backgrounds
    200: '#fde68a',   // Warning background
    500: '#f59e0b',   // Warning text, icons
    700: '#b45309',   // Dark warning text
    900: '#78350f',   // Very dark warning text
  },
} as const

export type PrimitiveColor = typeof primitiveColors