/**
 * Utility for responsive placeholder text that shows shorter versions on mobile
 */

interface PlaceholderOptions {
  desktop: string;
  mobile: string;
}

/**
 * Returns appropriate placeholder text based on screen size
 * For now, we'll use the mobile version for all since it's more reliable
 * In the future, this could be enhanced with breakpoint detection
 */
export function getResponsivePlaceholder(options: PlaceholderOptions): string {
  // For now, always use the shorter mobile version to ensure compatibility
  // This prevents issues with placeholder text being cut off on any device
  return options.mobile;
}

/**
 * Helper function to create responsive placeholder options
 */
export function createResponsivePlaceholder(desktop: string, mobile: string): PlaceholderOptions {
  return { desktop, mobile };
}

/**
 * Common responsive placeholders for reuse across components
 * NOTE: These are specifically for text input fields only, not textareas
 */
export const RESPONSIVE_PLACEHOLDERS = {
  // World creation placeholders
  worldName: createResponsivePlaceholder(
    "E.g., Hogwarts Adventures, Galaxy Far Far Away, Middle-earth Chronicles...",
    "E.g., Neo-Tokyo..."
  ),
  worldTheme: createResponsivePlaceholder(
    "e.g., Star Wars, Victorian London, Ancient Rome, 1960s New York",
    "e.g., Star Wars..."
  ),
  
  // Character creation placeholders
  characterName: createResponsivePlaceholder(
    "e.g., Aragorn, Princess Leia, Sherlock Holmes...",
    "e.g., Aragorn..."
  ),
  
  // Portrait placeholders
  portraitAppearance: createResponsivePlaceholder(
    "e.g., Long silver hair, green eyes, wearing a blue robe...",
    "e.g., silver hair..."
  ),
  portraitSetting: createResponsivePlaceholder(
    "e.g., In a forest, throne room, starship bridge...",
    "e.g., forest setting..."
  ),
  
  // General placeholders
  attributeName: createResponsivePlaceholder(
    "e.g., Strength, Intelligence",
    "e.g., Strength..."
  ),
} as const;