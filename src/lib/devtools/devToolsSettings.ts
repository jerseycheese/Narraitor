/**
 * DevTools Settings Storage
 *
 * Manages localStorage persistence for DevTools settings like showing
 * prompt debug information in narrative segments.
 */

const STORAGE_KEY = 'narraitor-devtools-settings';

/**
 * DevTools settings interface
 */
export interface DevToolsSettings {
  /** Whether to show prompt debug information in narrative segments */
  showPromptDebugInfo: boolean;
}

export const DEFAULT_DEVTOOLS_SETTINGS: DevToolsSettings = {
  showPromptDebugInfo: false,
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

export function loadDevToolsSettings(): DevToolsSettings {
  if (!isStorageAvailable()) {
    return { ...DEFAULT_DEVTOOLS_SETTINGS };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_DEVTOOLS_SETTINGS };
    }

    const parsed = JSON.parse(stored);

    // Ensure parsed data is valid and merge with defaults
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...DEFAULT_DEVTOOLS_SETTINGS, ...parsed };
    }

    return { ...DEFAULT_DEVTOOLS_SETTINGS };
  } catch (error) {
    console.warn('Failed to load DevTools settings from localStorage:', error);
    return { ...DEFAULT_DEVTOOLS_SETTINGS };
  }
}

export function saveDevToolsSettings(settings: DevToolsSettings): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save DevTools settings to localStorage:', error);
  }
}

export function updateSetting<K extends keyof DevToolsSettings>(
  key: K,
  value: DevToolsSettings[K]
): DevToolsSettings {
  const currentSettings = loadDevToolsSettings();
  const newSettings = { ...currentSettings, [key]: value };
  saveDevToolsSettings(newSettings);
  return newSettings;
}
