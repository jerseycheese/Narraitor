import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from './persistence';
import { isStorageAvailable } from '@/utils/storageHelpers';
import Logger from '@/lib/utils/logger';

/**
 * Create logger instance for this store
 */
const logger = new Logger('NavigationStore');

/**
 * Storage keys for different persistence layers
 */
const STORAGE_KEYS = {
  SESSION_PATH: 'narraitor-session-path',
  NAVIGATION_BREADCRUMBS: 'narraitor-navigation-breadcrumbs',
  FLOW_STATE: 'narraitor-flow-state',
} as const;

/**
 * Session storage helpers for temporary navigation state
 */
const sessionStorageHelpers = {
  setCurrentPath: (path: string): void => {
    if (!isStorageAvailable()) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_PATH, path);
      logger.debug('Saved current path to sessionStorage:', path);
    } catch (error) {
      logger.warn('Failed to save path to sessionStorage:', error);
    }
  },

  getCurrentPath: (): string | null => {
    if (!isStorageAvailable()) return null;
    try {
      const path = sessionStorage.getItem(STORAGE_KEYS.SESSION_PATH);
      logger.debug('Retrieved current path from sessionStorage:', path);
      return path;
    } catch (error) {
      logger.warn('Failed to retrieve path from sessionStorage:', error);
      return null;
    }
  },

  setBreadcrumbs: (breadcrumbs: string[]): void => {
    if (!isStorageAvailable()) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.NAVIGATION_BREADCRUMBS, JSON.stringify(breadcrumbs));
      logger.debug('Saved breadcrumbs to sessionStorage:', breadcrumbs);
    } catch (error) {
      logger.warn('Failed to save breadcrumbs to sessionStorage:', error);
    }
  },

  getBreadcrumbs: (): string[] => {
    if (!isStorageAvailable()) return [];
    try {
      const breadcrumbs = sessionStorage.getItem(STORAGE_KEYS.NAVIGATION_BREADCRUMBS);
      return breadcrumbs ? JSON.parse(breadcrumbs) : [];
    } catch (error) {
      logger.warn('Failed to retrieve breadcrumbs from sessionStorage:', error);
      return [];
    }
  },

  clearSession: (): void => {
    if (!isStorageAvailable()) return;
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
      logger.debug('Cleared navigation session storage');
    } catch (error) {
      logger.warn('Failed to clear navigation session storage:', error);
    }
  },
};

/**
 * Local storage helpers for persistent preferences
 */
const localStorageHelpers = {
  setFlowState: (flowState: string | null): void => {
    if (!isStorageAvailable()) return;
    try {
      if (flowState) {
        localStorage.setItem(STORAGE_KEYS.FLOW_STATE, flowState);
      } else {
        localStorage.removeItem(STORAGE_KEYS.FLOW_STATE);
      }
      logger.debug('Saved flow state to localStorage:', flowState);
    } catch (error) {
      logger.warn('Failed to save flow state to localStorage:', error);
    }
  },

  getFlowState: (): string | null => {
    if (!isStorageAvailable()) return null;
    try {
      const flowState = localStorage.getItem(STORAGE_KEYS.FLOW_STATE);
      logger.debug('Retrieved flow state from localStorage:', flowState);
      return flowState;
    } catch (error) {
      logger.warn('Failed to retrieve flow state from localStorage:', error);
      return null;
    }
  },
};

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  path: string;
  timestamp: string;
  title?: string;
  params?: Record<string, string>;
}

/**
 * Navigation preferences
 */
export interface NavigationPreferences {
  sidebarCollapsed: boolean;
  breadcrumbsEnabled: boolean;
  autoNavigateOnSelect: boolean;
  showRecentPages: boolean;
  maxRecentPages: number;
}

/**
 * Navigation state interface
 */
export interface NavigationState {
  // Current navigation state
  currentPath: string | null;
  previousPath: string | null;
  
  // Navigation history (recent pages)
  history: NavigationHistoryEntry[];
  
  // Navigation preferences
  preferences: NavigationPreferences;
  
  // Modal/dialog states
  modals: Record<string, boolean>;
  
  // Flow state persistence
  currentFlowStep: 'world' | 'character' | 'ready' | 'playing' | null;
  
  // Session-based breadcrumbs
  breadcrumbs: string[];
  
  // Hydration state
  isHydrated: boolean;
  
  // Actions
  setCurrentPath: (path: string, title?: string, params?: Record<string, string>) => void;
  addToHistory: (entry: NavigationHistoryEntry) => void;
  clearHistory: () => void;
  removeFromHistory: (path: string) => void;
  
  // Preferences
  updatePreferences: (updates: Partial<NavigationPreferences>) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Modal state management
  setModalState: (modalId: string, isOpen: boolean) => void;
  closeAllModals: () => void;
  
  // Flow state
  setCurrentFlowStep: (step: NavigationState['currentFlowStep']) => void;
  
  // Breadcrumb management
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  addBreadcrumb: (breadcrumb: string) => void;
  clearBreadcrumbs: () => void;
  
  // Hydration and initialization
  hydrateFromSession: () => void;
  initializeNavigation: (currentPath: string) => void;
  
  // Utility functions
  getRecentPages: (limit?: number) => NavigationHistoryEntry[];
  hasVisited: (path: string) => boolean;
}

/**
 * Default navigation preferences
 */
const defaultPreferences: NavigationPreferences = {
  sidebarCollapsed: false,
  breadcrumbsEnabled: true,
  autoNavigateOnSelect: true,
  showRecentPages: true,
  maxRecentPages: 10,
};

/**
 * Navigation store for managing navigation state persistence
 */
export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPath: null,
      previousPath: null,
      history: [],
      preferences: defaultPreferences,
      modals: {},
      currentFlowStep: null,
      breadcrumbs: [],
      isHydrated: false,

      // Navigation path management
      setCurrentPath: (path: string, title?: string, params?: Record<string, string>) => {
        logger.debug('Setting current path:', path, { title, params });
        
        set(state => {
          // Don't update if path is the same
          if (path === state.currentPath) {
            return state;
          }
          
          // Save to sessionStorage for browser refresh recovery
          sessionStorageHelpers.setCurrentPath(path);
          
          // Add to history if this is a new path
          const shouldAddToHistory = state.preferences.showRecentPages;
          
          const newHistory = shouldAddToHistory 
            ? [
                {
                  path,
                  timestamp: new Date().toISOString(),
                  title,
                  params,
                },
                ...state.history.filter(entry => entry.path !== path)
              ].slice(0, state.preferences.maxRecentPages)
            : state.history;

          return {
            previousPath: state.currentPath,
            currentPath: path,
            history: newHistory,
          };
        });
      },

      // History management
      addToHistory: (entry: NavigationHistoryEntry) => {
        logger.debug('Adding to history:', entry);
        
        set(state => {
          if (!state.preferences.showRecentPages) {
            return state;
          }

          const newHistory = [
            entry,
            ...state.history.filter(h => h.path !== entry.path)
          ].slice(0, state.preferences.maxRecentPages);

          return { history: newHistory };
        });
      },

      clearHistory: () => {
        logger.debug('Clearing navigation history');
        set({ history: [] });
      },

      removeFromHistory: (path: string) => {
        logger.debug('Removing from history:', path);
        set(state => ({
          history: state.history.filter(entry => entry.path !== path)
        }));
      },

      // Preferences management
      updatePreferences: (updates: Partial<NavigationPreferences>) => {
        logger.debug('Updating navigation preferences:', updates);
        
        set(state => {
          const newPreferences = { ...state.preferences, ...updates };
          
          // If maxRecentPages changed, trim history if needed
          const newHistory = newPreferences.maxRecentPages < state.history.length 
            ? state.history.slice(0, newPreferences.maxRecentPages)
            : state.history;

          return {
            preferences: newPreferences,
            history: newHistory,
          };
        });
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        logger.debug('Setting sidebar collapsed:', collapsed);
        
        set(state => ({
          preferences: {
            ...state.preferences,
            sidebarCollapsed: collapsed,
          }
        }));
      },

      // Modal state management
      setModalState: (modalId: string, isOpen: boolean) => {
        logger.debug('Setting modal state:', modalId, isOpen);
        
        set(state => ({
          modals: {
            ...state.modals,
            [modalId]: isOpen,
          }
        }));
      },

      closeAllModals: () => {
        logger.debug('Closing all modals');
        set((state) => {
          // Only update if there are actually modals to close
          if (Object.keys(state.modals).length === 0) {
            return state;
          }
          return { modals: {} };
        });
      },

      // Flow state management
      setCurrentFlowStep: (step: NavigationState['currentFlowStep']) => {
        logger.debug('Setting current flow step:', step);
        
        set(state => {
          // Don't update if step is the same
          if (step === state.currentFlowStep) {
            return state;
          }
          
          // Save to localStorage for persistence across sessions
          localStorageHelpers.setFlowState(step);
          
          return { currentFlowStep: step };
        });
      },

      // Breadcrumb management
      setBreadcrumbs: (breadcrumbs: string[]) => {
        logger.debug('Setting breadcrumbs:', breadcrumbs);
        
        // Save to sessionStorage for browser refresh recovery
        sessionStorageHelpers.setBreadcrumbs(breadcrumbs);
        
        set({ breadcrumbs });
      },

      addBreadcrumb: (breadcrumb: string) => {
        logger.debug('Adding breadcrumb:', breadcrumb);
        
        set(state => {
          const newBreadcrumbs = [...state.breadcrumbs, breadcrumb];
          
          // Also save to sessionStorage
          sessionStorageHelpers.setBreadcrumbs(newBreadcrumbs);
          
          return { breadcrumbs: newBreadcrumbs };
        });
      },

      clearBreadcrumbs: () => {
        logger.debug('Clearing breadcrumbs');
        
        sessionStorageHelpers.setBreadcrumbs([]);
        set({ breadcrumbs: [] });
      },

      // Hydration and initialization
      hydrateFromSession: () => {
        logger.debug('Hydrating navigation state from session storage');
        
        const sessionPath = sessionStorageHelpers.getCurrentPath();
        const sessionBreadcrumbs = sessionStorageHelpers.getBreadcrumbs();
        const flowState = localStorageHelpers.getFlowState();
        
        set(state => ({
          currentPath: sessionPath || state.currentPath,
          breadcrumbs: sessionBreadcrumbs.length > 0 ? sessionBreadcrumbs : state.breadcrumbs,
          currentFlowStep: (flowState as NavigationState['currentFlowStep']) || state.currentFlowStep,
          isHydrated: true,
        }));
        
        logger.debug('Navigation state hydrated:', { sessionPath, sessionBreadcrumbs, flowState });
      },

      initializeNavigation: (currentPath: string) => {
        logger.debug('Initializing navigation for path:', currentPath);
        
        set(state => {
          // If not already hydrated, hydrate from session storage
          if (!state.isHydrated) {
            const sessionPath = sessionStorageHelpers.getCurrentPath();
            const sessionBreadcrumbs = sessionStorageHelpers.getBreadcrumbs();
            const flowState = localStorageHelpers.getFlowState();
            
            logger.debug('Hydrating during initialization:', { sessionPath, sessionBreadcrumbs, flowState });
            
            // Update state with hydrated values and ensure initialization completes
            return {
              ...state,
              currentPath: sessionPath || currentPath,
              breadcrumbs: sessionBreadcrumbs.length > 0 ? sessionBreadcrumbs : state.breadcrumbs,
              currentFlowStep: (flowState as NavigationState['currentFlowStep']) || state.currentFlowStep,
              isHydrated: true,
              modals: {}, // Clear any lingering modals
            };
          }
          
          // Already hydrated, just ensure current path is set
          return {
            ...state,
            currentPath: state.currentPath || currentPath,
            modals: {}, // Clear any lingering modals
          };
        });
        
        logger.debug('Navigation initialized');
      },

      // Utility functions
      getRecentPages: (limit?: number) => {
        const { history, preferences } = get();
        const maxLimit = limit || preferences.maxRecentPages;
        return history.slice(0, maxLimit);
      },

      hasVisited: (path: string) => {
        const { history } = get();
        return history.some(entry => entry.path === path);
      },
    }),
    {
      name: 'narraitor-navigation-store',
      storage: createIndexedDBStorage(),
      version: 1,
      // Persist long-term navigation data (history, preferences)
      // Session-specific data (currentPath, breadcrumbs) are handled via sessionStorage
      // Flow state is handled via localStorage
      partialize: (state) => ({
        history: state.history,
        preferences: state.preferences,
        // Don't persist currentPath, breadcrumbs, or flowStep - handled by sessionStorage/localStorage
        // Don't persist modal states - they should be closed on reload
        // Don't persist isHydrated - this is runtime state
      }),
    }
  )
);