'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useNavigationLoading, UseNavigationLoadingReturn } from '@/hooks/useNavigationLoading';
import { LoadingOverlay } from './LoadingOverlay';

const NavigationLoadingContext = createContext<UseNavigationLoadingReturn | null>(null);

interface NavigationLoadingProviderProps {
  children: ReactNode;
}

/**
 * NavigationLoadingProvider - Provides navigation loading state throughout the app
 * 
 * This provider wraps the application and provides:
 * - Global navigation loading state management
 * - Automatic loading overlay display
 * - Shared loading context for components
 * 
 * @param props Provider props with children
 * @returns Provider component with loading overlay
 */
export const NavigationLoadingProvider: React.FC<NavigationLoadingProviderProps> = ({
  children,
}) => {
  const navigationLoading = useNavigationLoading();

  // Safety timeout: automatically clear loading after 30 seconds to prevent stuck states
  useEffect(() => {
    if (navigationLoading.isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Navigation loading state automatically cleared after 30 seconds');
        navigationLoading.clearLoading();
      }, 30000);

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationLoading.isLoading, navigationLoading.clearLoading]);

  const getLoadingVariant = () => {
    switch (navigationLoading.loadingState.loadingType) {
      case 'data':
        return 'skeleton';
      case 'error':
        return 'spinner';
      default:
        return 'dots';
    }
  };

  const getLoadingMessage = () => {
    if (navigationLoading.loadingState.message) {
      return navigationLoading.loadingState.message;
    }

    switch (navigationLoading.loadingState.loadingType) {
      case 'data':
        return 'Loading data...';
      case 'error':
        return 'Something went wrong. Please wait...';
      default:
        return 'Loading...';
    }
  };

  return (
    <NavigationLoadingContext.Provider value={navigationLoading}>
      {children}
      <LoadingOverlay
        isVisible={navigationLoading.isLoading}
        variant={getLoadingVariant()}
        message={getLoadingMessage()}
        onCancel={
          navigationLoading.loadingState.loadingType === 'error'
            ? navigationLoading.clearLoading
            : undefined
        }
      />
    </NavigationLoadingContext.Provider>
  );
};

/**
 * Hook to access navigation loading context
 * 
 * @throws Error if used outside NavigationLoadingProvider
 * @returns Navigation loading state and methods
 */
export const useNavigationLoadingContext = (): UseNavigationLoadingReturn => {
  const context = useContext(NavigationLoadingContext);
  
  if (!context) {
    throw new Error('useNavigationLoadingContext must be used within NavigationLoadingProvider');
  }
  
  return context;
};