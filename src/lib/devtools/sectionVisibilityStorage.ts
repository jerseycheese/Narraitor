/**
 * DevTools Section Visibility Storage
 * 
 * Manages localStorage persistence for DevTools section visibility preferences.
 * Provides error handling and fallback behavior for storage operations.
 */

const STORAGE_KEY = 'narraitor-devtools-section-visibility';

/**
 * DevTools section identifiers
 */
export enum DevToolsSection {
  STATE_SECTION = 'stateSection',
  STATE_INSPECTOR = 'stateInspectorSection',
  AI_TESTING = 'aiTestingPanel',
  TEST_DATA_GENERATOR = 'testDataGenerator',
  PORTRAIT_DEBUG = 'portraitDebug',
  ENDING_IMAGE_DEBUG = 'endingImageDebug',
  CONSISTENCY_VALIDATION = 'consistencyValidation',
  TEXT_NORMALIZATION = 'textNormalization',
  LORE_MANAGEMENT = 'loreManagement'
}

/**
 * Type for section visibility state
 */
export type SectionVisibility = Record<string, boolean>;

/**
 * Default visibility state for all sections
 */
export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  [DevToolsSection.STATE_SECTION]: true,
  [DevToolsSection.STATE_INSPECTOR]: true,
  [DevToolsSection.AI_TESTING]: true,
  [DevToolsSection.TEST_DATA_GENERATOR]: true,
  [DevToolsSection.PORTRAIT_DEBUG]: true,
  [DevToolsSection.ENDING_IMAGE_DEBUG]: true,
  [DevToolsSection.CONSISTENCY_VALIDATION]: true,
  [DevToolsSection.TEXT_NORMALIZATION]: true,
  [DevToolsSection.LORE_MANAGEMENT]: true,
};

/**
 * Check if localStorage is available and working
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load section visibility state from localStorage
 */
export function loadSectionVisibility(): SectionVisibility {
  if (!isStorageAvailable()) {
    return { ...DEFAULT_SECTION_VISIBILITY };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_SECTION_VISIBILITY };
    }

    const parsed = JSON.parse(stored);
    
    // Ensure parsed data is valid and merge with defaults
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...DEFAULT_SECTION_VISIBILITY, ...parsed };
    }
    
    return { ...DEFAULT_SECTION_VISIBILITY };
  } catch (error) {
    console.warn('Failed to load DevTools section visibility from localStorage:', error);
    return { ...DEFAULT_SECTION_VISIBILITY };
  }
}

/**
 * Save section visibility state to localStorage
 */
export function saveSectionVisibility(visibility: SectionVisibility): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  } catch (error) {
    console.warn('Failed to save DevTools section visibility to localStorage:', error);
  }
}

/**
 * Get visibility state for a specific section
 */
export function isSectionVisible(sectionId: string, visibility: SectionVisibility): boolean {
  return visibility[sectionId] ?? true; // Default to visible for unknown sections
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

/**
 * Reset all sections to default visibility
 */
export function resetSectionVisibility(): SectionVisibility {
  const defaultVisibility = { ...DEFAULT_SECTION_VISIBILITY };
  saveSectionVisibility(defaultVisibility);
  return defaultVisibility;
}