'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isClient, setIsClient] = useState(false);
  const [isDev, setIsDev] = useState(false);
  
  // Set client-side flag and check environment
  useEffect(() => {
    setIsClient(true);
    setIsDev(process.env.NODE_ENV === 'development');
  }, [initialIsOpen]);

  // Toggle function to show/hide DevTools
  const toggleDevTools = () => {
    setIsOpen(prev => !prev);
  };

  // On test page, we always want to render the DevTools provider
  const isDevToolsTest = typeof window !== 'undefined' && 
    window.location.pathname.includes('/dev/devtools-test');

  // Skip rendering in production (but always render in test page)
  if (isClient && !isDev && !isDevToolsTest) {
    return null;
  }

  return (
    <DevToolsContext.Provider value={{ isOpen, toggleDevTools }}>
      {children}
    </DevToolsContext.Provider>
  );
};

/**
 * Hook to use DevTools context
 */
export const useDevTools = () => useContext(DevToolsContext);