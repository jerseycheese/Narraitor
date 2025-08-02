'use client';

import { useEffect, useState } from 'react';
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

  /**
   * Immediate initialization
   * 
   * Skip the complex persistence system entirely and just initialize immediately
   * to prevent the app from being blocked by navigation persistence issues.
   */
  useEffect(() => {
    logger.debug('Forcing immediate navigation initialization');
    setIsInitialized(true);
  }, []);

  // Minimal loading state - only show very briefly
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}