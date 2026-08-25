'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import {
  loadSectionVisibility,
  loadSectionVisibilityWithDefaults,
  toggleSectionVisibility as toggleStoredSectionVisibility,
  setSectionVisibility as setStoredSectionVisibility,
  isSectionVisible,
  type SectionVisibility
} from '@/lib/devtools/sectionVisibilityStorage';
import {
  loadDevToolsSettings,
  updateSetting,
  type DevToolsSettings
} from '@/lib/devtools/devToolsSettings';

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
  settings: DevToolsSettings;
  updateSetting: <K extends keyof DevToolsSettings>(key: K, value: DevToolsSettings[K]) => void;
}

const defaultContext: DevToolsContextType = {
  isOpen: false,
  toggleDevTools: () => {
    // Default implementation does nothing
    // Will be overridden by the provider
  },
  sectionVisibility: {},
  toggleSectionVisibility: () => {},
  isSectionVisible: () => true,
  setSectionVisibility: () => {},
  settings: { showPromptDebugInfo: false },
  updateSetting: () => {}
};

const DevToolsContext = createContext<DevToolsContextType>(defaultContext);

/**
 * DevTools Provider Props
 */
interface DevToolsProviderProps {
  children: ReactNode;
  initialIsOpen?: boolean;
  defaultSectionVisibility?: SectionVisibility;
}

/**
 * DevTools Context Provider
 * 
 * Provides state management for the DevTools panel's open/closed state and section visibility.
 * Only renders children in development environment.
 */
export const DevToolsProvider = ({
  children,
  initialIsOpen = false,
  defaultSectionVisibility
}: DevToolsProviderProps) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isDev, setIsDev] = useState(false);
  const [sectionVisibility, setSectionVisibilityState] = useState<SectionVisibility>({});
  const [settings, setSettings] = useState<DevToolsSettings>({ showPromptDebugInfo: false });

  // Use ref to stabilize defaultSectionVisibility to prevent unnecessary re-runs
  const defaultSectionVisibilityRef = useRef(defaultSectionVisibility);
  defaultSectionVisibilityRef.current = defaultSectionVisibility;

  // Set client-side flag and check environment, load section visibility and settings
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');

    // Load section visibility from localStorage on mount
    // Use custom defaults if provided, otherwise use standard defaults
    const loadedVisibility = defaultSectionVisibilityRef.current
      ? loadSectionVisibilityWithDefaults(defaultSectionVisibilityRef.current)
      : loadSectionVisibility();
    setSectionVisibilityState(loadedVisibility);

    // Load DevTools settings from localStorage
    const loadedSettings = loadDevToolsSettings();
    setSettings(loadedSettings);
  }, []);

  // Toggle function to show/hide DevTools
  const toggleDevTools = () => {
    setIsOpen(prev => !prev);
  };

  // Toggle visibility for a specific section
  const toggleSectionVisibility = (sectionId: string) => {
    const newVisibility = toggleStoredSectionVisibility(sectionId, sectionVisibility);
    setSectionVisibilityState(newVisibility);
  };

  const checkSectionVisible = (sectionId: string) => {
    return isSectionVisible(sectionId, sectionVisibility);
  };

  // Set visibility for multiple sections
  const setSectionVisibility = (visibility: SectionVisibility) => {
    const newVisibility = setStoredSectionVisibility(visibility);
    setSectionVisibilityState(newVisibility);
  };

  // Update a specific setting
  const updateSettingHandler = <K extends keyof DevToolsSettings>(
    key: K,
    value: DevToolsSettings[K]
  ) => {
    const newSettings = updateSetting(key, value);
    setSettings(newSettings);
  };

  // Always render children, but only provide DevTools functionality in dev
  return (
    <DevToolsContext.Provider value={{
      isOpen: isDev ? isOpen : false,
      toggleDevTools,
      sectionVisibility,
      toggleSectionVisibility,
      isSectionVisible: checkSectionVisible,
      setSectionVisibility,
      settings,
      updateSetting: updateSettingHandler
    }}>
      {children}
    </DevToolsContext.Provider>
  );
};

export const useDevTools = () => useContext(DevToolsContext);
