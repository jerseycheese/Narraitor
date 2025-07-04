'use client';

import React, { useEffect } from 'react';
import { useGlobalKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSkipNavigationTargets } from '@/components/SkipNavigation';

export interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * AccessibilityProvider - Global accessibility setup and management
 * 
 * Provides global keyboard shortcuts, skip navigation targets, and other
 * accessibility features throughout the application.
 * 
 * Features:
 * - Global keyboard shortcut handling
 * - Skip navigation target management
 * - Screen reader support setup
 * - Focus management coordination
 * 
 * @param children - Child components to wrap
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  // Set up global keyboard shortcuts
  useGlobalKeyboardShortcuts();
  
  // Ensure skip navigation targets exist
  useSkipNavigationTargets();

  // Add accessibility-related CSS classes to body
  useEffect(() => {
    document.body.classList.add('keyboard-navigation-enabled');
    
    // Add focus-visible polyfill class
    if (!CSS.supports('selector(:focus-visible)')) {
      document.body.classList.add('focus-visible-polyfill');
    }

    return () => {
      document.body.classList.remove('keyboard-navigation-enabled', 'focus-visible-polyfill');
    };
  }, []);

  return <>{children}</>;
}