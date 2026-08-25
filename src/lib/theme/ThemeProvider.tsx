'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ColorScheme } from './colorScheme';
import {
  DEFAULT_COLOR_SCHEME,
  STORAGE_KEY_COLOR_SCHEME,
} from './colorScheme';

export interface ThemeContextValue {
  colorScheme: ColorScheme;
  resolvedColorScheme: 'light' | 'dark';
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return DEFAULT_COLOR_SCHEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COLOR_SCHEME);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_COLOR_SCHEME;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with defaults to match server render (FOUC script handles visual)
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  const resolvedColorScheme = colorScheme === 'system' ? systemPreference : colorScheme;

  // Sync React state from localStorage after hydration
  useEffect(() => {
    setColorSchemeState(readStoredColorScheme());
    setSystemPreference(getSystemPreference());
  }, []);

  // Apply dark class to <html>
  useEffect(() => {
    if (resolvedColorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_COLOR_SCHEME, colorScheme);
    } catch {
      // localStorage unavailable
    }
  }, [resolvedColorScheme, colorScheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setColorScheme = useCallback((s: ColorScheme) => setColorSchemeState(s), []);

  const value: ThemeContextValue = {
    colorScheme,
    resolvedColorScheme,
    setColorScheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
