'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useFormState } from '@/hooks';

/**
 * DevTools context interface
 */
interface DevToolsContextType {
  isOpen: boolean;
  toggleDevTools: () => void;
}

/**
 * Default context values
 */
const defaultContext: DevToolsContextType = {
  isOpen: false,
  toggleDevTools: () => {
    // Default implementation does nothing
    // Will be overridden by the provider
  }
};

/**
 * DevTools Context
 */
export const DevToolsContext = createContext<DevToolsContextType>(defaultContext);

/**
 * DevTools Provider Props
 */
interface DevToolsProviderProps {
  children: ReactNode;
  initialIsOpen?: boolean;
}

/**
 * DevTools Context Provider
 * 
 * Provides state management for the DevTools panel's open/closed state.
 * Only renders children in development environment.
 */
export const DevToolsProvider = ({ 
  children, 
  initialIsOpen = false 
}: DevToolsProviderProps) => {
  // Form state management using hooks
  const devToolsState = useFormState({
    initialData: {
      isOpen: initialIsOpen,
      isDev: false
    }
  });
  
  // Set client-side flag and check environment
  useEffect(() => {
    devToolsState.updateField('isDev', process.env.NODE_ENV === 'development');
  }, [initialIsOpen, devToolsState]);

  // Toggle function to show/hide DevTools
  const toggleDevTools = () => {
    devToolsState.updateField('isOpen', !devToolsState.data.isOpen);
  };

  // Always render children, but only provide DevTools functionality in dev
  return (
    <DevToolsContext.Provider value={{ isOpen: devToolsState.data.isDev ? devToolsState.data.isOpen : false, toggleDevTools }}>
      {children}
    </DevToolsContext.Provider>
  );
};

/**
 * Hook to use DevTools context
 */
export const useDevTools = () => useContext(DevToolsContext);
