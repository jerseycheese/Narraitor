import { useCallback, useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface NavigationLoadingState {
  isLoading: boolean;
  loadingType: 'page' | 'data' | 'error';
  message?: string;
  route?: string;
}

export interface UseNavigationLoadingReturn {
  isLoading: boolean;
  loadingState: NavigationLoadingState;
  setLoadingMessage: (message: string) => void;
  setLoadingState: (state: NavigationLoadingState) => void;
  clearLoading: () => void;
  navigateWithLoading: (href: string, message?: string) => void;
}

const DEBOUNCE_DELAY = 150; // ms - Prevent flash on fast connections
const MIN_DISPLAY_DURATION = 800; // ms - Minimum time to show loading for UX

/**
 * Hook for managing navigation loading states with debouncing and router integration
 * 
 * Features:
 * - Debounced loading states to prevent flash on fast connections
 * - Multiple loading types (page, data, error)
 * - Integration with Next.js router
 * - Automatic cleanup on unmount
 * 
 * @returns Navigation loading state management functions
 */
export function useNavigationLoading(): UseNavigationLoadingReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [displayLoading, setDisplayLoading] = useState(false);
  const [loadingState, setLoadingStateInternal] = useState<NavigationLoadingState>({
    isLoading: false,
    loadingType: 'page',
  });
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<NavigationLoadingState | null>(null);
  const lastPathRef = useRef<string>(pathname);
  const loadingStartTimeRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearLoading = useCallback(() => {
    // Clear any pending debounced loading
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    pendingStateRef.current = null;
    loadingStartTimeRef.current = null; // Clear start time
    setDisplayLoading(false);
    setLoadingStateInternal({
      isLoading: false,
      loadingType: 'page',
    });
  }, []);

  // Clear loading state when pathname changes (navigation complete)
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      
      // Clear loading state when navigation completes
      if (displayLoading && loadingStartTimeRef.current) {
        const elapsedTime = Date.now() - loadingStartTimeRef.current;
        const remainingTime = Math.max(0, MIN_DISPLAY_DURATION - elapsedTime);
        
        if (remainingTime > 0) {
          // Wait for minimum display duration before clearing
          setTimeout(() => {
            clearLoading();
          }, remainingTime);
        } else {
          // Already shown long enough, clear immediately
          clearLoading();
        }
      }
    }
  }, [pathname, displayLoading, clearLoading]);

  const setLoadingState = useCallback((state: NavigationLoadingState) => {
    if (!state.isLoading) {
      clearLoading();
      return;
    }

    pendingStateRef.current = state;
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // For explicit navigation or error states, show immediately
    if (state.loadingType === 'error' || state.route) {
      loadingStartTimeRef.current = Date.now(); // Record when loading starts
      setDisplayLoading(true);
      setLoadingStateInternal(state);
      return;
    }

    // Otherwise, debounce to prevent flash
    debounceTimerRef.current = setTimeout(() => {
      if (pendingStateRef.current?.isLoading) {
        loadingStartTimeRef.current = Date.now(); // Record when loading starts
        setDisplayLoading(true);
        setLoadingStateInternal(pendingStateRef.current);
      }
    }, DEBOUNCE_DELAY);
  }, [clearLoading]);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState({
      isLoading: true,
      loadingType: 'page',
      message,
    });
  }, [setLoadingState]);

  const navigateWithLoading = useCallback((href: string, message?: string) => {
    setLoadingState({
      isLoading: true,
      loadingType: 'page',
      message: message || 'Loading...',
      route: href,
    });
    
    router.push(href);
  }, [router, setLoadingState]);

  return {
    isLoading: displayLoading,
    loadingState,
    setLoadingMessage,
    setLoadingState,
    clearLoading,
    navigateWithLoading,
  };
}