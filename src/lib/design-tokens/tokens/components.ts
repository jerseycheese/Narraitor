/**
 * Component Design Tokens
 * Component-specific color combinations that reference semantic tokens
 * These provide ready-to-use color sets for specific UI components
 */

import { semanticColors, semanticColorsDark } from './semantic'

export const componentTokens = {
  // Button component tokens
  button: {
    primary: {
      light: {
        background: semanticColors.primary.default,
        backgroundHover: semanticColors.primary.hover,
        backgroundActive: semanticColors.primary.active,
        backgroundDisabled: semanticColors.primary.disabled,
        foreground: semanticColors.primary.foreground,
        foregroundDisabled: semanticColors.text.muted,
        border: semanticColors.primary.default,
        focus: semanticColors.interactive.focusRing,
      },
      dark: {
        background: semanticColorsDark.primary.default,
        backgroundHover: semanticColorsDark.primary.hover,
        backgroundActive: semanticColorsDark.primary.active,
        backgroundDisabled: semanticColorsDark.primary.disabled,
        foreground: semanticColorsDark.primary.foreground,
        foregroundDisabled: semanticColorsDark.text.muted,
        border: semanticColorsDark.primary.default,
        focus: semanticColorsDark.interactive.focusRing,
      },
    },
    secondary: {
      light: {
        background: semanticColors.secondary.default,
        backgroundHover: semanticColors.secondary.hover,
        backgroundActive: semanticColors.secondary.active,
        backgroundDisabled: semanticColors.secondary.disabled,
        foreground: semanticColors.secondary.foreground,
        foregroundDisabled: semanticColors.text.muted,
        border: semanticColors.border.default,
        focus: semanticColors.interactive.focusRing,
      },
      dark: {
        background: semanticColorsDark.secondary.default,
        backgroundHover: semanticColorsDark.secondary.hover,
        backgroundActive: semanticColorsDark.secondary.active,
        backgroundDisabled: semanticColorsDark.secondary.disabled,
        foreground: semanticColorsDark.secondary.foreground,
        foregroundDisabled: semanticColorsDark.text.muted,
        border: semanticColorsDark.border.default,
        focus: semanticColorsDark.interactive.focusRing,
      },
    },
    destructive: {
      light: {
        background: semanticColors.danger.default,
        backgroundHover: semanticColors.danger.hover,
        backgroundActive: semanticColors.danger.active,
        foreground: semanticColors.danger.foreground,
        border: semanticColors.danger.default,
        focus: semanticColors.interactive.focusRing,
      },
      dark: {
        background: semanticColorsDark.danger.default,
        backgroundHover: semanticColorsDark.danger.hover,
        backgroundActive: semanticColorsDark.danger.active,
        foreground: semanticColorsDark.danger.foreground,
        border: semanticColorsDark.danger.default,
        focus: semanticColorsDark.interactive.focusRing,
      },
    },
  },
  
  // Card component tokens
  card: {
    light: {
      background: semanticColors.surface.card,
      border: semanticColors.border.default,
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },
    dark: {
      background: semanticColorsDark.surface.card,
      border: semanticColorsDark.border.default,
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    },
  },
  
  // Input component tokens
  input: {
    light: {
      background: semanticColors.surface.default,
      border: semanticColors.border.default,
      borderFocus: semanticColors.interactive.focus,
      foreground: semanticColors.text.primary,
      placeholder: semanticColors.text.muted,
    },
    dark: {
      background: semanticColorsDark.surface.default,
      border: semanticColorsDark.border.default,
      borderFocus: semanticColorsDark.interactive.focus,
      foreground: semanticColorsDark.text.primary,
      placeholder: semanticColorsDark.text.muted,
    },
  },
  
  // Navigation component tokens
  navigation: {
    light: {
      background: semanticColors.surface.default,
      border: semanticColors.border.default,
      link: semanticColors.text.link,
      linkHover: semanticColors.text.linkHover,
      linkActive: semanticColors.primary.default,
    },
    dark: {
      background: semanticColorsDark.surface.default,
      border: semanticColorsDark.border.default,
      link: semanticColorsDark.text.link,
      linkHover: semanticColorsDark.text.linkHover,
      linkActive: semanticColorsDark.primary.default,
    },
  },
} as const

export type ComponentTokens = typeof componentTokens