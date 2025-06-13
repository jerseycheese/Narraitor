import { useNavigationStore } from '../navigationStore';

// Mock storage helpers to prevent issues in test environment
jest.mock('@/utils/storageHelpers', () => ({
  isStorageAvailable: jest.fn(() => true),
  handleStorageError: jest.fn((error) => ({ shouldNotify: false, error })),
}));

// Mock localStorage and sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock logger
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

describe('navigationStore', () => {
  beforeEach(() => {
    // Reset store state
    useNavigationStore.setState({
      currentPath: null,
      previousPath: null,
      history: [],
      preferences: {
        sidebarCollapsed: false,
        breadcrumbsEnabled: true,
        autoNavigateOnSelect: true,
        showRecentPages: true,
        maxRecentPages: 10,
      },
      modals: {},
      currentFlowStep: null,
      breadcrumbs: [],
      isHydrated: false,
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = useNavigationStore.getState();
      
      expect(state.currentPath).toBeNull();
      expect(state.previousPath).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.modals).toEqual({});
      expect(state.currentFlowStep).toBeNull();
      expect(state.breadcrumbs).toEqual([]);
      expect(state.isHydrated).toBe(false);
    });

    test('should have default preferences', () => {
      const state = useNavigationStore.getState();
      
      expect(state.preferences).toEqual({
        sidebarCollapsed: false,
        breadcrumbsEnabled: true,
        autoNavigateOnSelect: true,
        showRecentPages: true,
        maxRecentPages: 10,
      });
    });
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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      });
      
      clearHistory();
      
      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(0);
    });

    test('should remove specific path from history', () => {
      const { addToHistory, removeFromHistory } = useNavigationStore.getState();
      
      addToHistory({
        path: '/path-1',
        timestamp: new Date().toISOString(),
      });
      addToHistory({
        path: '/path-2',
        timestamp: new Date().toISOString(),
      });
      
      removeFromHistory('/path-1');
      
      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0].path).toBe('/path-2');
    });
  });

  describe('preferences management', () => {
    test('should update preferences', () => {
      const { updatePreferences } = useNavigationStore.getState();
      
      updatePreferences({
        sidebarCollapsed: true,
        maxRecentPages: 5,
      });
      
      const state = useNavigationStore.getState();
      expect(state.preferences.sidebarCollapsed).toBe(true);
      expect(state.preferences.maxRecentPages).toBe(5);
      expect(state.preferences.breadcrumbsEnabled).toBe(true); // unchanged
    });

    test('should trim history when maxRecentPages is reduced', () => {
      const { setCurrentPath, updatePreferences } = useNavigationStore.getState();
      
      // Add 5 pages to history
      for (let i = 1; i <= 5; i++) {
        setCurrentPath(`/path-${i}`, `Page ${i}`);
      }
      
      // Reduce limit to 3
      updatePreferences({ maxRecentPages: 3 });
      
      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(3);
    });

    test('should set sidebar collapsed state', () => {
      const { setSidebarCollapsed } = useNavigationStore.getState();
      
      setSidebarCollapsed(true);
      
      const state = useNavigationStore.getState();
      expect(state.preferences.sidebarCollapsed).toBe(true);
    });
  });

  describe('modal state management', () => {
    test('should set modal state', () => {
      const { setModalState } = useNavigationStore.getState();
      
      setModalState('testModal', true);
      
      const state = useNavigationStore.getState();
      expect(state.modals.testModal).toBe(true);
    });

    test('should close all modals', () => {
      const { setModalState, closeAllModals } = useNavigationStore.getState();
      
      setModalState('modal1', true);
      setModalState('modal2', true);
      closeAllModals();
      
      const state = useNavigationStore.getState();
      expect(state.modals).toEqual({});
    });
  });

  describe('flow state management', () => {
    test('should set current flow step and save to localStorage', () => {
      const { setCurrentFlowStep } = useNavigationStore.getState();
      
      setCurrentFlowStep('character');
      
      const state = useNavigationStore.getState();
      expect(state.currentFlowStep).toBe('character');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'narraitor-flow-state',
        'character'
      );
    });

    test('should clear flow state when set to null', () => {
      const { setCurrentFlowStep } = useNavigationStore.getState();
      
      // First set to a non-null value
      setCurrentFlowStep('world');
      
      // Then clear it
      setCurrentFlowStep(null);
      
      const state = useNavigationStore.getState();
      expect(state.currentFlowStep).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('narraitor-flow-state');
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

  describe('hydration and initialization', () => {
    test('should hydrate from session storage', () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'narraitor-session-path':
            return '/hydrated-path';
          case 'narraitor-navigation-breadcrumbs':
            return JSON.stringify(['Home', 'Hydrated']);
          default:
            return null;
        }
      });

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'narraitor-flow-state':
            return 'character';
          default:
            return null;
        }
      });

      const { hydrateFromSession } = useNavigationStore.getState();
      hydrateFromSession();

      const state = useNavigationStore.getState();
      expect(state.currentPath).toBe('/hydrated-path');
      expect(state.breadcrumbs).toEqual(['Home', 'Hydrated']);
      expect(state.currentFlowStep).toBe('character');
      expect(state.isHydrated).toBe(true);
    });

    test('should initialize navigation', () => {
      const { initializeNavigation } = useNavigationStore.getState();
      
      // Clear any previous mock implementations
      mockSessionStorage.getItem.mockReturnValue(null);
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Set up some initial state to test cleanup
      useNavigationStore.setState({
        modals: { testModal: true },
      });

      initializeNavigation('/current-path');

      const state = useNavigationStore.getState();
      expect(state.currentPath).toBe('/current-path');
      expect(state.modals).toEqual({});
      expect(state.isHydrated).toBe(true);
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

  describe('storage error handling', () => {
    test('should handle sessionStorage errors gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const { setCurrentPath } = useNavigationStore.getState();
      
      // Should not throw
      expect(() => setCurrentPath('/test-path')).not.toThrow();
      
      const state = useNavigationStore.getState();
      expect(state.currentPath).toBe('/test-path'); // State should still update
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const { setCurrentFlowStep } = useNavigationStore.getState();
      
      // Should not throw
      expect(() => setCurrentFlowStep('character')).not.toThrow();
      
      const state = useNavigationStore.getState();
      expect(state.currentFlowStep).toBe('character'); // State should still update
    });
  });
});