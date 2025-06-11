import { renderHook, act } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationPersistence } from '../useNavigationPersistence';
import { useNavigationStore } from '@/state/navigationStore';
import { useNavigationFlow } from '../useNavigationFlow';

const mockUseNavigationStore = useNavigationStore as jest.MockedFunction<typeof useNavigationStore> & {
  getState: jest.MockedFunction<() => Record<string, unknown>>;
};

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock navigation flow hook
jest.mock('../useNavigationFlow', () => ({
  useNavigationFlow: jest.fn(),
}));

// Mock navigation store
jest.mock('@/state/navigationStore', () => {
  const mockStore = jest.fn();
  mockStore.getState = jest.fn();
  return {
    useNavigationStore: mockStore,
  };
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

// Mock navigation loading context
const mockNavigateWithLoading = jest.fn();
jest.mock('@/components/shared/NavigationLoadingProvider', () => ({
  useNavigationLoadingContext: () => ({
    navigateWithLoading: mockNavigateWithLoading,
  }),
}));

describe('useNavigationPersistence', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockInitializeNavigation = jest.fn();
  const mockHydrateFromSession = jest.fn();
  const mockSetCurrentPath = jest.fn();
  const mockSetCurrentFlowStep = jest.fn();
  const mockSetBreadcrumbs = jest.fn();
  const mockGetCurrentFlowStep = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    // Mock usePathname
    (usePathname as jest.Mock).mockReturnValue('/test-path');

    // Mock useNavigationFlow
    (useNavigationFlow as jest.Mock).mockReturnValue({
      getCurrentFlowStep: mockGetCurrentFlowStep,
    });

    // Mock navigation store
    const storeState = {
      currentPath: '/test-path',
      isHydrated: true,
      preferences: {
        sidebarCollapsed: false,
        breadcrumbsEnabled: true,
        autoNavigateOnSelect: true,
        showRecentPages: true,
        maxRecentPages: 10,
      },
      setCurrentPath: mockSetCurrentPath,
      setCurrentFlowStep: mockSetCurrentFlowStep,
      initializeNavigation: mockInitializeNavigation,
      hydrateFromSession: mockHydrateFromSession,
      setBreadcrumbs: mockSetBreadcrumbs,
    };
    
    mockUseNavigationStore.mockReturnValue(storeState);
    mockUseNavigationStore.getState.mockReturnValue(storeState);

    mockGetCurrentFlowStep.mockReturnValue('character');
  });

  describe('initialization', () => {
    test('should initialize navigation persistence on mount', () => {
      renderHook(() => useNavigationPersistence());

      expect(mockInitializeNavigation).toHaveBeenCalledWith('/test-path');
      expect(mockSetCurrentFlowStep).toHaveBeenCalledWith('character');
    });

    test('should update navigation state when pathname changes', () => {
      const { rerender } = renderHook(() => useNavigationPersistence());

      // Change pathname
      (usePathname as jest.Mock).mockReturnValue('/new-path');
      rerender();

      expect(mockSetCurrentPath).toHaveBeenCalledWith('/new-path', '');
      expect(mockSetCurrentFlowStep).toHaveBeenCalledWith('character');
    });

    test('should not update navigation when not hydrated', () => {
      // Mock store as not hydrated
      const notHydratedState = {
        currentPath: '/test-path',
        isHydrated: false,
        preferences: {},
        setCurrentPath: mockSetCurrentPath,
        setCurrentFlowStep: mockSetCurrentFlowStep,
        initializeNavigation: mockInitializeNavigation,
        hydrateFromSession: mockHydrateFromSession,
        setBreadcrumbs: mockSetBreadcrumbs,
      };
      
      mockUseNavigationStore.mockReturnValue(notHydratedState);
      mockUseNavigationStore.getState.mockReturnValue(notHydratedState);

      renderHook(() => useNavigationPersistence());

      // Should still initialize
      expect(mockInitializeNavigation).toHaveBeenCalledWith('/test-path');
      
      // But setCurrentPath should not be called for path changes
      expect(mockSetCurrentPath).not.toHaveBeenCalled();
    });
  });

  describe('navigation with persistence', () => {
    test('should navigate with persistence using push', () => {
      const { result } = renderHook(() => useNavigationPersistence());

      act(() => {
        result.current.navigateWithPersistence('/target-path');
      });

      expect(mockPush).toHaveBeenCalledWith('/target-path');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test('should navigate with persistence using replace', () => {
      const { result } = renderHook(() => useNavigationPersistence());

      act(() => {
        result.current.navigateWithPersistence('/target-path', { replace: true });
      });

      expect(mockReplace).toHaveBeenCalledWith('/target-path');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('browser navigation handling', () => {
    test('should handle popstate events', () => {
      renderHook(() => useNavigationPersistence());

      // Simulate popstate event
      act(() => {
        const popstateEvent = new Event('popstate');
        window.dispatchEvent(popstateEvent);
      });

      expect(mockSetCurrentPath).toHaveBeenCalledWith('/test-path');
      expect(mockSetCurrentFlowStep).toHaveBeenCalledWith('character');
    });

    test('should not handle popstate when not hydrated', () => {
      // Mock store as not hydrated
      const notHydratedState = {
        currentPath: '/test-path',
        isHydrated: false,
        preferences: {},
        setCurrentPath: mockSetCurrentPath,
        setCurrentFlowStep: mockSetCurrentFlowStep,
        initializeNavigation: mockInitializeNavigation,
        hydrateFromSession: mockHydrateFromSession,
        setBreadcrumbs: mockSetBreadcrumbs,
      };
      
      mockUseNavigationStore.mockReturnValue(notHydratedState);
      mockUseNavigationStore.getState.mockReturnValue(notHydratedState);

      renderHook(() => useNavigationPersistence());

      // Clear any calls from initialization
      jest.clearAllMocks();

      // Simulate popstate event
      act(() => {
        const popstateEvent = new Event('popstate');
        window.dispatchEvent(popstateEvent);
      });

      expect(mockSetCurrentPath).not.toHaveBeenCalled();
    });
  });

  describe('page visibility handling', () => {
    test('should hydrate from session when page becomes visible', () => {
      renderHook(() => useNavigationPersistence());

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });

      act(() => {
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      expect(mockHydrateFromSession).toHaveBeenCalled();
    });

    test('should not hydrate when page is hidden', () => {
      renderHook(() => useNavigationPersistence());

      // Clear initialization calls
      jest.clearAllMocks();

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });

      act(() => {
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      expect(mockHydrateFromSession).not.toHaveBeenCalled();
    });

    test('should not hydrate when not hydrated', () => {
      // Mock store as not hydrated
      const notHydratedState = {
        currentPath: '/test-path',
        isHydrated: false,
        preferences: {},
        setCurrentPath: mockSetCurrentPath,
        setCurrentFlowStep: mockSetCurrentFlowStep,
        initializeNavigation: mockInitializeNavigation,
        hydrateFromSession: mockHydrateFromSession,
        setBreadcrumbs: mockSetBreadcrumbs,
      };
      
      mockUseNavigationStore.mockReturnValue(notHydratedState);
      mockUseNavigationStore.getState.mockReturnValue(notHydratedState);

      renderHook(() => useNavigationPersistence());

      // Clear initialization calls
      jest.clearAllMocks();

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });

      act(() => {
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      expect(mockHydrateFromSession).not.toHaveBeenCalled();
    });
  });

  describe('return values', () => {
    test('should return current navigation state and utilities', () => {
      const { result } = renderHook(() => useNavigationPersistence());

      expect(result.current).toEqual({
        currentPath: '/test-path',
        isHydrated: true,
        navigateWithPersistence: expect.any(Function),
        preferences: {
          sidebarCollapsed: false,
          breadcrumbsEnabled: true,
          autoNavigateOnSelect: true,
          showRecentPages: true,
          maxRecentPages: 10,
        },
        setCurrentPath: mockSetCurrentPath,
        setCurrentFlowStep: mockSetCurrentFlowStep,
        setBreadcrumbs: mockSetBreadcrumbs,
      });
    });
  });

  describe('document title handling', () => {
    test('should include document title when setting current path', () => {
      // Mock document.title
      Object.defineProperty(document, 'title', {
        value: 'Test Page Title',
        writable: true,
      });

      const { rerender } = renderHook(() => useNavigationPersistence());

      // Clear initialization calls
      jest.clearAllMocks();

      // Change pathname to trigger path update
      (usePathname as jest.Mock).mockReturnValue('/new-path');
      rerender();

      expect(mockSetCurrentPath).toHaveBeenCalledWith('/new-path', 'Test Page Title');
    });
  });

  describe('event cleanup', () => {
    test('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const documentRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useNavigationPersistence());

      // Verify event listeners were added
      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(documentAddEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      // Unmount and verify cleanup
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      // Restore spies
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
      documentAddEventListenerSpy.mockRestore();
      documentRemoveEventListenerSpy.mockRestore();
    });
  });
});