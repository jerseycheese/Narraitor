/**
 * Tests for navigationStore state management
 * Covers preferences, modals, and flow state
 */

import { useNavigationStore } from '../navigationStore';
import { setupMockStorage, getDefaultNavigationState } from './navigationStore.testHelpers';

describe('navigationStore - State Management', () => {
  let mockLocalStorage: ReturnType<typeof setupMockStorage>['mockLocalStorage'];

  beforeEach(() => {
    const mocks = setupMockStorage();
    mockLocalStorage = mocks.mockLocalStorage;

    // Reset store state
    useNavigationStore.setState(getDefaultNavigationState());

    // Clear mocks
    jest.clearAllMocks();
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
});
