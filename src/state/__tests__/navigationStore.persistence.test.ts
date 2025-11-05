/**
 * Tests for navigationStore persistence functionality
 * Covers hydration, initialization, and storage error handling
 */

import { useNavigationStore } from '../navigationStore';
import { setupMockStorage, getDefaultNavigationState } from './navigationStore.testHelpers';

describe('navigationStore - Persistence', () => {
  let mockSessionStorage: ReturnType<typeof setupMockStorage>['mockSessionStorage'];
  let mockLocalStorage: ReturnType<typeof setupMockStorage>['mockLocalStorage'];

  beforeEach(() => {
    const mocks = setupMockStorage();
    mockSessionStorage = mocks.mockSessionStorage;
    mockLocalStorage = mocks.mockLocalStorage;

    // Reset store state
    useNavigationStore.setState(getDefaultNavigationState());

    // Clear mocks
    jest.clearAllMocks();
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
