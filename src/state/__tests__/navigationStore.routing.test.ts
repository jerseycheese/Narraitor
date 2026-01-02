/**
 * Tests for navigationStore routing functionality
 * Covers path management, history, and breadcrumbs
 */

import { useNavigationStore } from '../navigationStore';
import { setupMockStorage, getDefaultNavigationState } from './navigationStore.testHelpers';

describe('navigationStore - Routing', () => {
  beforeEach(() => {
    setupMockStorage();

    // Reset store state
    useNavigationStore.setState(getDefaultNavigationState());

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('path management', () => {
    test('should not add to history when showRecentPages is disabled', () => {
      const { setCurrentPath, updatePreferences } = useNavigationStore.getState();

      updatePreferences({ showRecentPages: false });
      setCurrentPath('/test-path', 'Test Page');

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(0);
    });

    test('should not add duplicate paths to history', () => {
      const { setCurrentPath } = useNavigationStore.getState();

      setCurrentPath('/test-path', 'Test Page');
      setCurrentPath('/other-path', 'Other Page');
      setCurrentPath('/test-path', 'Test Page Updated');

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(2);
      expect(state.history[0].path).toBe('/test-path');
      expect(state.history[0].title).toBe('Test Page Updated');
      expect(state.history[1].path).toBe('/other-path');
    });

    test('should respect maxRecentPages limit', () => {
      const { setCurrentPath, updatePreferences } = useNavigationStore.getState();

      updatePreferences({ maxRecentPages: 3 });

      for (let i = 1; i <= 5; i++) {
        setCurrentPath(`/path-${i}`, `Page ${i}`);
      }

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(3);
      expect(state.history[0].path).toBe('/path-5');
      expect(state.history[1].path).toBe('/path-4');
      expect(state.history[2].path).toBe('/path-3');
    });
  });
});
