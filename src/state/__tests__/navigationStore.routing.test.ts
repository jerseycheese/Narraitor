/**
 * Tests for navigationStore routing functionality
 * Covers path management, history, and breadcrumbs
 */

import { useNavigationStore } from '../navigationStore';
import { getTimestamp } from '@/lib/utils/timestamp';
import { setupMockStorage, getDefaultNavigationState } from './navigationStore.testHelpers';

describe('navigationStore - Routing', () => {
  let mockSessionStorage: ReturnType<typeof setupMockStorage>['mockSessionStorage'];

  beforeEach(() => {
    const mocks = setupMockStorage();
    mockSessionStorage = mocks.mockSessionStorage;

    // Reset store state
    useNavigationStore.setState(getDefaultNavigationState());

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('path management', () => {
    test('should set current path and save to sessionStorage', () => {
      const { setCurrentPath } = useNavigationStore.getState();

      setCurrentPath('/test-path', 'Test Page');

      const state = useNavigationStore.getState();
      expect(state.currentPath).toBe('/test-path');
      expect(state.previousPath).toBeNull();
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'narraitor-session-path',
        '/test-path'
      );
    });

    test('should update previous path when setting new current path', () => {
      const { setCurrentPath } = useNavigationStore.getState();

      setCurrentPath('/first-path');
      setCurrentPath('/second-path');

      const state = useNavigationStore.getState();
      expect(state.currentPath).toBe('/second-path');
      expect(state.previousPath).toBe('/first-path');
    });

    test('should add to history when setting new path', () => {
      const { setCurrentPath } = useNavigationStore.getState();

      setCurrentPath('/test-path', 'Test Page', { param1: 'value1' });

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toMatchObject({
        path: '/test-path',
        title: 'Test Page',
        params: { param1: 'value1' },
      });
      expect(state.history[0].timestamp).toBeDefined();
    });

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

  describe('history management', () => {
    test('should add entry to history', () => {
      const { addToHistory } = useNavigationStore.getState();

      const entry = {
        path: '/test-path',
        timestamp: getTimestamp(),
        title: 'Test Page',
      };

      addToHistory(entry);

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toEqual(entry);
    });

    test('should clear history', () => {
      const { addToHistory, clearHistory } = useNavigationStore.getState();

      addToHistory({
        path: '/test-path',
        timestamp: getTimestamp(),
      });

      clearHistory();

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(0);
    });

    test('should remove specific path from history', () => {
      const { addToHistory, removeFromHistory } = useNavigationStore.getState();

      addToHistory({
        path: '/path-1',
        timestamp: getTimestamp(),
      });
      addToHistory({
        path: '/path-2',
        timestamp: getTimestamp(),
      });

      removeFromHistory('/path-1');

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0].path).toBe('/path-2');
    });
  });

  describe('breadcrumb management', () => {
    test('should set breadcrumbs and save to sessionStorage', () => {
      const { setBreadcrumbs } = useNavigationStore.getState();

      const breadcrumbs = ['Home', 'Worlds', 'Test World'];
      setBreadcrumbs(breadcrumbs);

      const state = useNavigationStore.getState();
      expect(state.breadcrumbs).toEqual(breadcrumbs);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'narraitor-navigation-breadcrumbs',
        JSON.stringify(breadcrumbs)
      );
    });

    test('should add breadcrumb', () => {
      const { setBreadcrumbs, addBreadcrumb } = useNavigationStore.getState();

      setBreadcrumbs(['Home', 'Worlds']);
      addBreadcrumb('Test World');

      const state = useNavigationStore.getState();
      expect(state.breadcrumbs).toEqual(['Home', 'Worlds', 'Test World']);
      expect(mockSessionStorage.setItem).toHaveBeenLastCalledWith(
        'narraitor-navigation-breadcrumbs',
        JSON.stringify(['Home', 'Worlds', 'Test World'])
      );
    });

    test('should clear breadcrumbs', () => {
      const { setBreadcrumbs, clearBreadcrumbs } = useNavigationStore.getState();

      setBreadcrumbs(['Home', 'Worlds']);
      clearBreadcrumbs();

      const state = useNavigationStore.getState();
      expect(state.breadcrumbs).toEqual([]);
      expect(mockSessionStorage.setItem).toHaveBeenLastCalledWith(
        'narraitor-navigation-breadcrumbs',
        JSON.stringify([])
      );
    });
  });

  describe('utility functions', () => {
    test('should get recent pages with limit', () => {
      const { setCurrentPath, getRecentPages } = useNavigationStore.getState();

      for (let i = 1; i <= 5; i++) {
        setCurrentPath(`/path-${i}`, `Page ${i}`);
      }

      const recentPages = getRecentPages(3);
      expect(recentPages).toHaveLength(3);
      expect(recentPages[0].path).toBe('/path-5');
    });

    test('should check if path has been visited', () => {
      const { setCurrentPath, hasVisited } = useNavigationStore.getState();

      setCurrentPath('/visited-path');

      expect(hasVisited('/visited-path')).toBe(true);
      expect(hasVisited('/not-visited')).toBe(false);
    });

    test('should get recent pages respecting preferences maxRecentPages', () => {
      const { setCurrentPath, updatePreferences, getRecentPages } = useNavigationStore.getState();

      updatePreferences({ maxRecentPages: 3 });

      for (let i = 1; i <= 5; i++) {
        setCurrentPath(`/path-${i}`, `Page ${i}`);
      }

      const recentPages = getRecentPages();
      expect(recentPages).toHaveLength(3);
    });
  });
});
