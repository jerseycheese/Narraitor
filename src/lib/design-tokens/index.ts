/**
 * Design Tokens - Main Export
 * Centralized access to all design tokens with type safety
 */

export { primitiveColors } from './tokens/primitives'
export { semanticColors, semanticColorsDark } from './tokens/semantic'
export { componentTokens } from './tokens/components'
export { endingTones, loreCategories, portraitThemes } from './tokens/contextual'

export type {
  PrimitiveColor,
} from './tokens/primitives'

export type {
  SemanticColors,
  SemanticColorsDark,
} from './tokens/semantic'

export type {
  ComponentTokens,
} from './tokens/components'

export type {
  EndingTones,
  LoreCategories,
  PortraitThemes,
} from './tokens/contextual'

// Utility function to get CSS variable name from token path
export function getCSSVariable(tokenPath: string): string {
  return `--${tokenPath.replace(/\./g, '-')}`
}

// Utility function to convert token object to CSS variables
export function tokensToCSSVariables(tokens: Record<string, string | Record<string, unknown>>, prefix = ''): Record<string, string> {
  const variables: Record<string, string> = {}
  
  Object.entries(tokens).forEach(([key, value]) => {
    const variableName = prefix ? `${prefix}-${key}` : key
    
    if (typeof value === 'string') {
      variables[getCSSVariable(variableName)] = value
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(variables, tokensToCSSVariables(value as Record<string, string | Record<string, unknown>>, variableName))
    }
  })
  
  return variables
}