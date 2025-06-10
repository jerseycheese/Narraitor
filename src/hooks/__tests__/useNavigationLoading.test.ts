import { renderHook, act } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationLoading } from '../useNavigationLoading';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('useNavigationLoading', () => {
  let mockRouter: {
    push: jest.Mock;
    replace: jest.Mock;
    back: jest.Mock;
    forward: jest.Mock;
    refresh: jest.Mock;
    events: {
      on: jest.Mock;
      off: jest.Mock;
    };
  };

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    };
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
    mockUsePathname.mockReturnValue('/');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with loading false', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadingState.isLoading).toBe(false);
      expect(result.current.loadingState.loadingType).toBe('page');
    });

    it('should initialize with empty message', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      expect(result.current.loadingState.message).toBeUndefined();
      expect(result.current.loadingState.route).toBeUndefined();
    });
  });

  describe('Loading State Management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set loading state when navigation starts', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      act(() => {
        result.current.setLoadingMessage('Loading page...');
      });
      
      // Should not immediately show loading (debounced)
      expect(result.current.isLoading).toBe(false);
      
      // After debounce delay
      act(() => {
        jest.advanceTimersByTime(150);
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingState.message).toBe('Loading page...');
    });

    it('should clear loading state quickly', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      // Start loading
      act(() => {
        result.current.setLoadingMessage('Loading...');
        jest.advanceTimersByTime(150);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      // Clear loading
      act(() => {
        result.current.clearLoading();
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    it('should prevent flash on fast transitions', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      // Start loading
      act(() => {
        result.current.setLoadingMessage('Loading...');
      });
      
      // Clear before debounce delay
      act(() => {
        jest.advanceTimersByTime(100); // Less than 150ms threshold
        result.current.clearLoading();
      });
      
      // Should never have shown loading
      expect(result.current.isLoading).toBe(false);
      
      // Advance past debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Should still be false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Loading Types', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should support different loading types', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      act(() => {
        result.current.setLoadingState({
          isLoading: true,
          loadingType: 'data',
          message: 'Loading character data...',
          route: '/characters/123'
        });
        jest.advanceTimersByTime(150);
      });
      
      expect(result.current.loadingState.loadingType).toBe('data');
      expect(result.current.loadingState.route).toBe('/characters/123');
    });

    it('should handle error states', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      act(() => {
        result.current.setLoadingState({
          isLoading: true,
          loadingType: 'error',
          message: 'Failed to load page',
        });
        jest.advanceTimersByTime(150);
      });
      
      expect(result.current.loadingState.loadingType).toBe('error');
      expect(result.current.loadingState.message).toBe('Failed to load page');
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clear timers on unmount', () => {
      const { result, unmount } = renderHook(() => useNavigationLoading());
      
      act(() => {
        result.current.setLoadingMessage('Loading...');
      });
      
      unmount();
      
      // Should not throw or cause memory leaks
      expect(() => {
        jest.advanceTimersByTime(200);
      }).not.toThrow();
    });
  });

  describe('Router Integration', () => {
    it('should provide router navigation methods', () => {
      const { result } = renderHook(() => useNavigationLoading());
      
      expect(result.current.navigateWithLoading).toBeDefined();
      expect(typeof result.current.navigateWithLoading).toBe('function');
    });

    it('should trigger loading state during navigation', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useNavigationLoading());
      
      act(() => {
        result.current.navigateWithLoading('/worlds', 'Loading worlds...');
      });
      
      // Should start loading immediately for explicit navigation
      expect(result.current.isLoading).toBe(true);
      expect(mockRouter.push).toHaveBeenCalledWith('/worlds');
      
      jest.useRealTimers();
    });
  });
});