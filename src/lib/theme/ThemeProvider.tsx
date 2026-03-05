'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { DesignSystem, ColorScheme } from './index';
import {
  DEFAULT_THEME,
  DEFAULT_COLOR_SCHEME,
  STORAGE_KEY_THEME,
  STORAGE_KEY_COLOR_SCHEME,
} from './index';

export interface ThemeContextValue {
  theme: DesignSystem;
  colorScheme: ColorScheme;
  resolvedColorScheme: 'light' | 'dark';
  setTheme: (theme: DesignSystem) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredTheme(): DesignSystem {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'ds1' || stored === 'ds2' || stored === 'ds3') return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_THEME;
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
  const [theme, setThemeState] = useState<DesignSystem>(readStoredTheme);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(readStoredColorScheme);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference);

  const resolvedColorScheme = colorScheme === 'system' ? systemPreference : colorScheme;

  // Apply theme attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

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

  const setTheme = useCallback((t: DesignSystem) => setThemeState(t), []);
  const setColorScheme = useCallback((s: ColorScheme) => setColorSchemeState(s), []);

  const value: ThemeContextValue = {
    theme,
    colorScheme,
    resolvedColorScheme,
    setTheme,
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
