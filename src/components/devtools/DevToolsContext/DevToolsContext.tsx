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
  const [isDev, setIsDev] = useState(false);
  
  // Set environment check
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  // Toggle function to show/hide DevTools
  const toggleDevTools = () => {
    setIsOpen(prev => !prev);
  };

  // Always render children, but only provide DevTools functionality in dev
  return (
    <DevToolsContext.Provider value={{ isOpen: isDev ? isOpen : false, toggleDevTools }}>
      {children}
    </DevToolsContext.Provider>
  );
};

/**
 * Hook to use DevTools context
 */
export const useDevTools = () => useContext(DevToolsContext);