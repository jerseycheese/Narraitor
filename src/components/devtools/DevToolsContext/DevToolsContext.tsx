'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  loadSectionVisibility, 
  toggleSectionVisibility as toggleStoredSectionVisibility,
  setSectionVisibility as setStoredSectionVisibility,
  isSectionVisible,
  type SectionVisibility 
} from '@/lib/devtools/sectionVisibilityStorage';

/**
 * DevTools context interface
 */
interface DevToolsContextType {
  isOpen: boolean;
  toggleDevTools: () => void;
  sectionVisibility: SectionVisibility;
  toggleSectionVisibility: (sectionId: string) => void;
  isSectionVisible: (sectionId: string) => boolean;
  setSectionVisibility: (visibility: SectionVisibility) => void;
}

/**
 * Default context values
 */
const defaultContext: DevToolsContextType = {
  isOpen: false,
  toggleDevTools: () => {
    // Default implementation does nothing
    // Will be overridden by the provider
  },
  sectionVisibility: {},
  toggleSectionVisibility: () => {},
  isSectionVisible: () => true,
  setSectionVisibility: () => {}
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
 * Provides state management for the DevTools panel's open/closed state and section visibility.
 * Only renders children in development environment.
 */
export const DevToolsProvider = ({ 
  children, 
  initialIsOpen = false 
}: DevToolsProviderProps) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isDev, setIsDev] = useState(false);
  const [sectionVisibility, setSectionVisibilityState] = useState<SectionVisibility>({});
  
  // Set client-side flag and check environment, load section visibility
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
    
    // Load section visibility from localStorage on mount
    const loadedVisibility = loadSectionVisibility();
    setSectionVisibilityState(loadedVisibility);
  }, [initialIsOpen]);

  // Toggle function to show/hide DevTools
  const toggleDevTools = () => {
    setIsOpen(prev => !prev);
  };

  // Toggle visibility for a specific section
  const toggleSectionVisibility = (sectionId: string) => {
    const newVisibility = toggleStoredSectionVisibility(sectionId, sectionVisibility);
    setSectionVisibilityState(newVisibility);
  };

  // Check if a section is visible
  const checkSectionVisible = (sectionId: string) => {
    return isSectionVisible(sectionId, sectionVisibility);
  };

  // Set visibility for multiple sections
  const setSectionVisibility = (visibility: SectionVisibility) => {
    const newVisibility = setStoredSectionVisibility(visibility);
    setSectionVisibilityState(newVisibility);
  };

  // Always render children, but only provide DevTools functionality in dev
  return (
    <DevToolsContext.Provider value={{ 
      isOpen: isDev ? isOpen : false, 
      toggleDevTools,
      sectionVisibility,
      toggleSectionVisibility,
      isSectionVisible: checkSectionVisible,
      setSectionVisibility
    }}>
      {children}
    </DevToolsContext.Provider>
  );
};

/**
 * Hook to use DevTools context
 */
export const useDevTools = () => useContext(DevToolsContext);
