'use client';

import { useEffect, useState } from 'react';
import { useNavigationPersistence } from '@/hooks/useNavigationPersistence';
import Logger from '@/lib/utils/logger';

/**
 * Create logger instance for this component
 */
const logger = new Logger('NavigationPersistenceProvider');

interface NavigationPersistenceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes navigation state persistence
 * and ensures proper hydration of navigation state across sessions.
 * 
 * This component:
 * - Initializes navigation persistence on app startup
 * - Handles hydration from sessionStorage/localStorage
 * - Provides navigation state to child components
 * - Manages navigation state persistence across browser sessions
 */
export function NavigationPersistenceProvider({ children }: NavigationPersistenceProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isHydrated } = useNavigationPersistence();

  /**
   * Initialize navigation persistence once hydration is complete
   * 
   * This effect ensures we only mark initialization as complete after
   * the navigation store has been properly hydrated from storage.
   */
  useEffect(() => {
    if (isHydrated && !isInitialized) {
      logger.debug('Navigation persistence initialized');
      setIsInitialized(true);
    }
  }, [isHydrated, isInitialized]);

  /**
   * Safety timeout to prevent stuck loading states
   * 
   * If initialization doesn't complete within 3 seconds (due to storage
   * issues, network problems, etc.), force initialization to prevent
   * the app from being stuck in a loading state indefinitely.
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        logger.warn('Navigation initialization timed out, forcing initialization');
        setIsInitialized(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isInitialized]);

  // Show loading state until navigation is fully hydrated
  // This prevents flash of incorrect navigation state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">
          Initializing navigation...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}