/**
 * DevTools Section Visibility Storage
 *
 * Manages localStorage persistence for DevTools section visibility preferences.
 * Storage access goes through the SSR-safe browserStorage wrapper, which no-ops
 * on the server and treats missing/corrupt values as "no value".
 */

import { readJSON, writeJSON } from '@/lib/utils/browserStorage';

const STORAGE_KEY = 'narraitor-devtools-section-visibility';

/**
 * DevTools section identifiers
 */
export enum DevToolsSection {
  STATE_SECTION = 'stateSection',
  TEST_DATA_GENERATOR = 'testDataGenerator',
  AI_TESTING = 'aiTestingPanel',
  PORTRAIT_DEBUG = 'portraitDebug',
  ENDING_IMAGE_DEBUG = 'endingImageDebug',
  CONSISTENCY_VALIDATION = 'consistencyValidation',
  LORE_MANAGEMENT = 'loreManagement',
  ERROR_SECTION = 'errorSection',
  TOKEN_BUDGET = 'tokenBudget',
  DECISION_CONSOLE = 'decisionConsole',
  DECISION_FLOW = 'decisionFlow'
}

/**
 * Type for section visibility state
 * Uses Partial to allow subset updates while maintaining type safety
 */
export type SectionVisibility = Partial<Record<DevToolsSection, boolean>>;

/**
 * Default visibility state for all sections
 */
export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  [DevToolsSection.STATE_SECTION]: true,
  [DevToolsSection.TEST_DATA_GENERATOR]: true,
  [DevToolsSection.AI_TESTING]: true,
  [DevToolsSection.PORTRAIT_DEBUG]: true,
  [DevToolsSection.ENDING_IMAGE_DEBUG]: true,
  [DevToolsSection.CONSISTENCY_VALIDATION]: true,
  [DevToolsSection.LORE_MANAGEMENT]: true,
  [DevToolsSection.ERROR_SECTION]: true,
  [DevToolsSection.TOKEN_BUDGET]: true,
  [DevToolsSection.DECISION_CONSOLE]: true,
  [DevToolsSection.DECISION_FLOW]: true,
};

/**
 * Load section visibility state from localStorage
 */
export function loadSectionVisibility(): SectionVisibility {
  return loadSectionVisibilityWithDefaults(DEFAULT_SECTION_VISIBILITY);
}

/**
 * Load section visibility state from localStorage with custom defaults
 */
export function loadSectionVisibilityWithDefaults(defaultVisibility: SectionVisibility): SectionVisibility {
  const stored = readJSON<SectionVisibility | null>('local', STORAGE_KEY, null);

  if (stored && typeof stored === 'object') {
    return { ...defaultVisibility, ...stored };
  }

  return { ...defaultVisibility };
}

/**
 * Save section visibility state to localStorage
 */
export function saveSectionVisibility(visibility: SectionVisibility): void {
  writeJSON('local', STORAGE_KEY, visibility);
}

/**
 * Get visibility state for a specific section
 */
export function isSectionVisible(sectionId: string, visibility: SectionVisibility): boolean {
  if (!(sectionId in visibility)) {
    console.warn(
      `[DevTools] Unknown section ID "${sectionId}" accessed in isSectionVisible. Defaulting to visible.`
    );
    return true;
  }
  return visibility[sectionId as DevToolsSection] ?? true;
}

/**
 * Toggle visibility for a specific section
 */
export function toggleSectionVisibility(
  sectionId: string, 
  currentVisibility: SectionVisibility
): SectionVisibility {
  const newVisibility = {
    ...currentVisibility,
    [sectionId]: !isSectionVisible(sectionId, currentVisibility)
  };
  
  saveSectionVisibility(newVisibility);
  return newVisibility;
}

/**
 * Set visibility for multiple sections
 */
export function setSectionVisibility(newVisibility: SectionVisibility): SectionVisibility {
  const mergedVisibility = { ...DEFAULT_SECTION_VISIBILITY, ...newVisibility };
  saveSectionVisibility(mergedVisibility);
  return mergedVisibility;
}
