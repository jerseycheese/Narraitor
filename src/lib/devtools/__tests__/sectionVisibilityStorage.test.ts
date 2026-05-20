/**
 * @jest-environment jsdom
 *
 * Issue #646: behavioral coverage for DevTools section-visibility persistence.
 * Persistence was extracted from the provider into these pure functions, which
 * dissolves the original mock-isolation problem — real jsdom localStorage,
 * cleared between tests, replaces the stateful mock.
 */
import {
  loadSectionVisibility,
  loadSectionVisibilityWithDefaults,
  saveSectionVisibility,
  toggleSectionVisibility,
  setSectionVisibility,
  isSectionVisible,
  DEFAULT_SECTION_VISIBILITY,
  DevToolsSection,
} from '../sectionVisibilityStorage';

const STORAGE_KEY = 'narraitor-devtools-section-visibility';

describe('sectionVisibilityStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadSectionVisibility', () => {
    it('returns defaults when storage is empty', () => {
      expect(loadSectionVisibility()).toEqual(DEFAULT_SECTION_VISIBILITY);
    });

    it('falls back to defaults when stored value is corrupt JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(loadSectionVisibility()).toEqual(DEFAULT_SECTION_VISIBILITY);
    });
  });

  describe('loadSectionVisibilityWithDefaults', () => {
    it('merges stored values over the provided defaults', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ [DevToolsSection.STATE_SECTION]: false })
      );

      const result = loadSectionVisibilityWithDefaults(DEFAULT_SECTION_VISIBILITY);

      expect(result[DevToolsSection.STATE_SECTION]).toBe(false);
      expect(result[DevToolsSection.AI_TESTING]).toBe(true);
    });
  });

  describe('saveSectionVisibility', () => {
    it('persists state that survives a reload', () => {
      const visibility = {
        ...DEFAULT_SECTION_VISIBILITY,
        [DevToolsSection.ERROR_SECTION]: false,
      };

      saveSectionVisibility(visibility);

      expect(loadSectionVisibility()).toEqual(visibility);
    });
  });

  describe('toggleSectionVisibility', () => {
    it('flips a section and persists the change', () => {
      const next = toggleSectionVisibility(
        DevToolsSection.STATE_SECTION,
        DEFAULT_SECTION_VISIBILITY
      );

      expect(next[DevToolsSection.STATE_SECTION]).toBe(false);
      expect(loadSectionVisibility()[DevToolsSection.STATE_SECTION]).toBe(false);
    });
  });

  describe('setSectionVisibility', () => {
    it('merges partial input with defaults and persists', () => {
      const result = setSectionVisibility({ [DevToolsSection.LORE_MANAGEMENT]: false });

      expect(result[DevToolsSection.LORE_MANAGEMENT]).toBe(false);
      expect(result[DevToolsSection.STATE_SECTION]).toBe(true);
      expect(loadSectionVisibility()[DevToolsSection.LORE_MANAGEMENT]).toBe(false);
    });
  });

  describe('isSectionVisible', () => {
    it('defaults to visible for an unknown section id', () => {
      expect(isSectionVisible('nonexistentSection', DEFAULT_SECTION_VISIBILITY)).toBe(true);
    });
  });
});
