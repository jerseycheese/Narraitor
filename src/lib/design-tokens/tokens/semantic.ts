/**
 * Semantic Design Tokens
 * Contextual color mappings that reference primitive tokens
 * These provide meaning and intent for color usage
 */

import { primitiveColors } from './primitives'

export const semanticColors = {
  // Primary brand colors
  primary: {
    default: primitiveColors.blue[600],
    hover: primitiveColors.blue[700],
    active: primitiveColors.blue[800],
    disabled: primitiveColors.gray[400],
    foreground: primitiveColors.white,
  },
  
  // Secondary actions
  secondary: {
    default: primitiveColors.gray[200],
    hover: primitiveColors.gray[300],
    active: primitiveColors.gray[400],
    disabled: primitiveColors.gray[100],
    foreground: primitiveColors.gray[900],
  },
  
  // Muted/subtle elements
  muted: {
    default: primitiveColors.gray[100],
    hover: primitiveColors.gray[200],
    foreground: primitiveColors.gray[600],
  },
  
  // Success states
  success: {
    default: primitiveColors.green[600],
    hover: primitiveColors.green[700],
    active: primitiveColors.green[800],
    background: primitiveColors.green[50],
    border: primitiveColors.green[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.green[100],
  },
  
  // Warning states
  warning: {
    default: primitiveColors.amber[500],
    hover: primitiveColors.amber[600],
    active: primitiveColors.amber[700],
    background: primitiveColors.amber[50],
    border: primitiveColors.amber[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.amber[100],
  },
  
  // Danger/error states
  danger: {
    default: primitiveColors.red[600],
    hover: primitiveColors.red[700],
    active: primitiveColors.red[800],
    background: primitiveColors.red[50],
    border: primitiveColors.red[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.red[100],
  },
  
  // Informational states
  info: {
    default: primitiveColors.blue[500],
    hover: primitiveColors.blue[600],
    active: primitiveColors.blue[700],
    background: primitiveColors.blue[50],
    border: primitiveColors.blue[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.blue[100],
  },
  
  // Surface colors
  surface: {
    default: primitiveColors.white,
    muted: primitiveColors.gray[50],
    subtle: primitiveColors.gray[100],
    card: primitiveColors.white,
    overlay: '#00000080', // 50% black opacity
  },
  
  // Border colors
  border: {
    default: primitiveColors.gray[200],
    muted: primitiveColors.gray[100],
    strong: primitiveColors.gray[300],
  },
  
  // Text colors
  text: {
    primary: primitiveColors.gray[900],
    secondary: primitiveColors.gray[600],
    muted: primitiveColors.gray[500],
    inverse: primitiveColors.white,
    link: primitiveColors.blue[600],
    linkHover: primitiveColors.blue[700],
  },
  
  // Interactive states
  interactive: {
    hover: primitiveColors.gray[50],
    focus: primitiveColors.blue[500],
    focusRing: primitiveColors.blue[200],
  },
} as const

// Dark theme semantic colors
export const semanticColorsDark = {
  primary: {
    default: primitiveColors.blue[500],
    hover: primitiveColors.blue[400],
    active: primitiveColors.blue[300],
    disabled: primitiveColors.gray[600],
    foreground: primitiveColors.gray[900],
  },
  
  secondary: {
    default: primitiveColors.gray[700],
    hover: primitiveColors.gray[600],
    active: primitiveColors.gray[500],
    disabled: primitiveColors.gray[800],
    foreground: primitiveColors.gray[100],
  },
  
  muted: {
    default: primitiveColors.gray[800],
    hover: primitiveColors.gray[700],
    foreground: primitiveColors.gray[400],
  },
  
  success: {
    default: primitiveColors.green[500],
    hover: primitiveColors.green[400],
    active: primitiveColors.green[300],
    background: primitiveColors.green[950],
    border: primitiveColors.green[800],
    foreground: primitiveColors.gray[900],
    muted: primitiveColors.green[900],
  },
  
  warning: {
    default: primitiveColors.amber[400],
    hover: primitiveColors.amber[300],
    active: primitiveColors.amber[200],
    background: primitiveColors.amber[950],
    border: primitiveColors.amber[800],
    foreground: primitiveColors.gray[900],
    muted: primitiveColors.amber[900],
  },
  
  danger: {
    default: primitiveColors.red[500],
    hover: primitiveColors.red[400],
    active: primitiveColors.red[300],
    background: primitiveColors.red[950],
    border: primitiveColors.red[800],
    foreground: primitiveColors.gray[900],
    muted: primitiveColors.red[900],
  },
  
  info: {
    default: primitiveColors.blue[400],
    hover: primitiveColors.blue[300],
    active: primitiveColors.blue[200],
    background: primitiveColors.blue[950],
    border: primitiveColors.blue[800],
    foreground: primitiveColors.gray[900],
    muted: primitiveColors.blue[900],
  },
  
  surface: {
    default: primitiveColors.gray[900],
    muted: primitiveColors.gray[800],
    subtle: primitiveColors.gray[700],
    card: primitiveColors.gray[800],
    overlay: '#00000080',
  },
  
  border: {
    default: primitiveColors.gray[700],
    muted: primitiveColors.gray[800],
    strong: primitiveColors.gray[600],
  },
  
  text: {
    primary: primitiveColors.gray[100],
    secondary: primitiveColors.gray[300],
    muted: primitiveColors.gray[400],
    inverse: primitiveColors.gray[900],
    link: primitiveColors.blue[400],
    linkHover: primitiveColors.blue[300],
  },
  
  interactive: {
    hover: primitiveColors.gray[800],
    focus: primitiveColors.blue[400],
    focusRing: primitiveColors.blue[600],
  },
} as const

export type SemanticColors = typeof semanticColors
export type SemanticColorsDark = typeof semanticColorsDark