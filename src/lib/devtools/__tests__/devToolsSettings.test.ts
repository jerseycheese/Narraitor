/**
 * @jest-environment jsdom
 */
import {
  loadDevToolsSettings,
  saveDevToolsSettings,
  updateSetting,
  DEFAULT_DEVTOOLS_SETTINGS,
} from '../devToolsSettings';

describe('devToolsSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadDevToolsSettings', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = loadDevToolsSettings();
      expect(settings).toEqual(DEFAULT_DEVTOOLS_SETTINGS);
    });

    it('should load settings from localStorage when they exist', () => {
      const customSettings = { showPromptDebugInfo: true };
      localStorage.setItem('narraitor-devtools-settings', JSON.stringify(customSettings));

      const settings = loadDevToolsSettings();
      expect(settings.showPromptDebugInfo).toBe(true);
    });

    it('should merge stored settings with defaults', () => {
      // Store only partial settings
      localStorage.setItem('narraitor-devtools-settings', JSON.stringify({}));

      const settings = loadDevToolsSettings();
      expect(settings).toEqual(DEFAULT_DEVTOOLS_SETTINGS);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('narraitor-devtools-settings', 'invalid json');

      const settings = loadDevToolsSettings();
      expect(settings).toEqual(DEFAULT_DEVTOOLS_SETTINGS);
    });

    it('should handle null stored value gracefully', () => {
      localStorage.setItem('narraitor-devtools-settings', JSON.stringify(null));

      const settings = loadDevToolsSettings();
      expect(settings).toEqual(DEFAULT_DEVTOOLS_SETTINGS);
    });
  });

  describe('saveDevToolsSettings', () => {
    it('should save settings to localStorage', () => {
      const settings = { showPromptDebugInfo: true };
      saveDevToolsSettings(settings);

      const stored = localStorage.getItem('narraitor-devtools-settings');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(settings);
    });

    it('should overwrite existing settings', () => {
      saveDevToolsSettings({ showPromptDebugInfo: true });
      saveDevToolsSettings({ showPromptDebugInfo: false });

      const stored = localStorage.getItem('narraitor-devtools-settings');
      expect(JSON.parse(stored!).showPromptDebugInfo).toBe(false);
    });
  });

  describe('updateSetting', () => {
    it('should update a single setting', () => {
      const result = updateSetting('showPromptDebugInfo', true);
      expect(result.showPromptDebugInfo).toBe(true);
    });

    it('should persist the updated setting', () => {
      updateSetting('showPromptDebugInfo', true);

      const loaded = loadDevToolsSettings();
      expect(loaded.showPromptDebugInfo).toBe(true);
    });

    it('should preserve other settings when updating one', () => {
      // Future-proof: if we add more settings, this test ensures they're preserved
      updateSetting('showPromptDebugInfo', true);

      const loaded = loadDevToolsSettings();
      expect(loaded.showPromptDebugInfo).toBe(true);
    });
  });
});
