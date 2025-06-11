import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigationStore } from '@/state/navigationStore';
import { useNavigationFlow } from './useNavigationFlow';
import Logger from '@/lib/utils/logger';

/**
 * Create logger instance for this hook
 */
const logger = new Logger('useNavigationPersistence');

/**
 * Hook for managing navigation state persistence and hydration
 * 
 * Features:
 * - Automatic hydration on mount from sessionStorage/localStorage
 * - Path tracking and history management
 * - Flow state synchronization
 * - Breadcrumb persistence
 * - Integration with existing navigation flow
 * 
 * @returns Navigation persistence utilities
 */
export function useNavigationPersistence() {
  const pathname = usePathname();
  const router = useRouter();
  const { getCurrentFlowStep } = useNavigationFlow();
  
  const {
    currentPath,
    isHydrated,
    setCurrentPath,
    setCurrentFlowStep,
    initializeNavigation,
    hydrateFromSession,
    setBreadcrumbs,
    preferences,
  } = useNavigationStore();

  /**
   * Initialize navigation persistence on first load
   */
  const initializePersistence = useCallback(() => {
    logger.debug('Initializing navigation persistence for path:', pathname);
    
    initializeNavigation(pathname);
    
    // Sync flow step with current navigation state
    const currentFlowStep = getCurrentFlowStep();
    setCurrentFlowStep(currentFlowStep);
    
  }, [pathname, initializeNavigation, getCurrentFlowStep, setCurrentFlowStep]);

  /**
   * Update navigation state when pathname changes
   */
  const handlePathChange = useCallback(() => {
    if (!isHydrated) return;
    
    logger.debug('Path changed to:', pathname);
    
    // Extract title from document if available (for better history)
    const title = typeof document !== 'undefined' ? document.title : undefined;
    
    setCurrentPath(pathname, title);
    
    // Update flow step
    const currentFlowStep = getCurrentFlowStep();
    setCurrentFlowStep(currentFlowStep);
    
  }, [pathname, isHydrated, setCurrentPath, getCurrentFlowStep, setCurrentFlowStep]);

  /**
   * Navigate with persistence
   */
  const navigateWithPersistence = useCallback((href: string, options?: { replace?: boolean }) => {
    logger.debug('Navigating with persistence to:', href, options);
    
    if (options?.replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  }, [router]);

  /**
   * Restore navigation state from URL on browser back/forward
   */
  const handleBrowserNavigation = useCallback(() => {
    if (!isHydrated) return;
    
    logger.debug('Browser navigation detected, updating state for:', pathname);
    
    // Update current path without adding to history (browser already handled it)
    const state = useNavigationStore.getState();
    state.setCurrentPath(pathname);
    
    // Update flow step
    const currentFlowStep = getCurrentFlowStep();
    setCurrentFlowStep(currentFlowStep);
    
  }, [pathname, isHydrated, getCurrentFlowStep, setCurrentFlowStep]);

  // Initialize on mount
  useEffect(() => {
    initializePersistence();
  }, [initializePersistence]);

  // Track path changes
  useEffect(() => {
    handlePathChange();
  }, [handlePathChange]);

  // Handle browser navigation events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      handleBrowserNavigation();
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBrowserNavigation]);

  // Handle page visibility changes (restore state when returning to tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden && isHydrated) {
        logger.debug('Page became visible, refreshing navigation state');
        hydrateFromSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHydrated, hydrateFromSession]);

  return {
    currentPath,
    isHydrated,
    navigateWithPersistence,
    preferences,
    
    // Expose store methods for advanced usage
    setCurrentPath,
    setCurrentFlowStep,
    setBreadcrumbs,
  };
}