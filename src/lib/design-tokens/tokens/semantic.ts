/**
 * Semantic Design Tokens
 * Contextual color mappings that reference primitive tokens
 * These provide meaning and intent for color usage
 */

import { primitiveColors } from './primitives'

export const semanticColors = {
  // Primary brand colors
  primary: {
    default: primitiveColors.blue[500],
    hover: primitiveColors.blue[700],
    active: primitiveColors.blue[900],
    disabled: primitiveColors.zinc[500],
    foreground: primitiveColors.white,
  },
  
  // Secondary actions
  secondary: {
    default: primitiveColors.zinc[100],
    hover: primitiveColors.zinc[300],
    active: primitiveColors.zinc[500],
    disabled: primitiveColors.zinc[100],
    foreground: primitiveColors.zinc[900],
  },
  
  // Muted/subtle elements
  muted: {
    default: primitiveColors.zinc[100],
    hover: primitiveColors.zinc[300],
    foreground: primitiveColors.zinc[500],
  },
  
  // Success states
  success: {
    default: primitiveColors.green[500],
    hover: primitiveColors.green[700],
    active: primitiveColors.green[700],
    background: primitiveColors.green[200],
    border: primitiveColors.green[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.green[200],
  },
  
  // Warning states
  warning: {
    default: primitiveColors.amber[500],
    hover: primitiveColors.amber[700],
    active: primitiveColors.amber[700],
    background: primitiveColors.amber[200],
    border: primitiveColors.amber[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.amber[200],
  },
  
  // Danger/error states
  danger: {
    default: primitiveColors.red[500],
    hover: primitiveColors.red[700],
    active: primitiveColors.red[700],
    background: primitiveColors.red[200],
    border: primitiveColors.red[200],
    foreground: primitiveColors.white,
    muted: primitiveColors.red[200],
  },
  
  // Informational states
  info: {
    default: primitiveColors.blue[500],
    hover: primitiveColors.blue[700],
    active: primitiveColors.blue[900],
    background: primitiveColors.blue[100],
    border: primitiveColors.blue[300],
    foreground: primitiveColors.white,
    muted: primitiveColors.blue[100],
  },
  
  // Surface colors
  surface: {
    default: primitiveColors.white,
    muted: primitiveColors.zinc[100],
    subtle: primitiveColors.zinc[100],
    card: primitiveColors.white,
    overlay: primitiveColors.black + '80', // 50% black opacity using our black token
  },
  
  // Border colors
  border: {
    default: primitiveColors.zinc[300],
    muted: primitiveColors.zinc[100],
    strong: primitiveColors.zinc[300],
  },
  
  // Text colors
  text: {
    primary: primitiveColors.zinc[900],
    secondary: primitiveColors.zinc[700],
    muted: primitiveColors.zinc[500],
    inverse: primitiveColors.white,
    link: primitiveColors.blue[500],
    linkHover: primitiveColors.blue[700],
  },
  
  // Interactive states
  interactive: {
    hover: primitiveColors.zinc[100],
    focus: primitiveColors.blue[500],
    focusRing: primitiveColors.blue[300],
  },
} as const

// Dark theme semantic colors
const semanticColorsDark = {
  primary: {
    default: primitiveColors.blue[500],
    hover: primitiveColors.blue[300],
    active: primitiveColors.blue[100],
    disabled: primitiveColors.zinc[500],
    foreground: primitiveColors.zinc[900],
  },
  
  secondary: {
    default: primitiveColors.zinc[700],
    hover: primitiveColors.zinc[500],
    active: primitiveColors.zinc[300],
    disabled: primitiveColors.zinc[900],
    foreground: primitiveColors.zinc[100],
  },
  
  muted: {
    default: primitiveColors.zinc[900],
    hover: primitiveColors.zinc[700],
    foreground: primitiveColors.zinc[500],
  },
  
  success: {
    default: primitiveColors.green[500],
    hover: primitiveColors.green[700],
    active: primitiveColors.green[200],
    background: primitiveColors.zinc[900],
    border: primitiveColors.green[700],
    foreground: primitiveColors.zinc[100],
    muted: primitiveColors.zinc[700],
  },
  
  warning: {
    default: primitiveColors.amber[500],
    hover: primitiveColors.amber[200],
    active: primitiveColors.amber[200],
    background: primitiveColors.zinc[900],
    border: primitiveColors.amber[700],
    foreground: primitiveColors.zinc[100],
    muted: primitiveColors.zinc[700],
  },
  
  danger: {
    default: primitiveColors.red[500],
    hover: primitiveColors.red[200],
    active: primitiveColors.red[200],
    background: primitiveColors.zinc[900],
    border: primitiveColors.red[700],
    foreground: primitiveColors.zinc[100],
    muted: primitiveColors.zinc[700],
  },
  
  info: {
    default: primitiveColors.blue[300],
    hover: primitiveColors.blue[300],
    active: primitiveColors.blue[100],
    background: primitiveColors.zinc[900],
    border: primitiveColors.blue[700],
    foreground: primitiveColors.zinc[100],
    muted: primitiveColors.zinc[700],
  },
  
  surface: {
    default: primitiveColors.zinc[900],
    muted: primitiveColors.zinc[900],
    subtle: primitiveColors.zinc[700],
    card: primitiveColors.zinc[900],
    overlay: primitiveColors.black + '80', // Using our black token
  },
  
  border: {
    default: primitiveColors.zinc[700],
    muted: primitiveColors.zinc[900],
    strong: primitiveColors.zinc[500],
  },
  
  text: {
    primary: primitiveColors.zinc[100],
    secondary: primitiveColors.zinc[300],
    muted: primitiveColors.zinc[500],
    inverse: primitiveColors.zinc[900],
    link: primitiveColors.blue[300],
    linkHover: primitiveColors.blue[100],
  },
  
  interactive: {
    hover: primitiveColors.zinc[900],
    focus: primitiveColors.blue[300],
    focusRing: primitiveColors.blue[500],
  },
} as const

export type SemanticColors = typeof semanticColors
export type SemanticColorsDark = typeof semanticColorsDark