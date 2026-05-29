'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { DSTheme } from './DSToggle';

/**
 * Forces the global design-system theme to match the showcase page (issue
 * #1276). The DS pages theme their in-page content via a local `data-theme`
 * wrapper, but Radix-portaled overlays (Dialog, SimpleModal) render to
 * `document.body` — outside that wrapper — so they'd otherwise resolve tokens
 * from the default global theme instead of the page's. Setting the global
 * theme keeps portaled canon (modals) themed to the page, the same way
 * `/dev/game-session` forces the theme for its iframe captures.
 */
export function ForceTheme({ theme }: { theme: DSTheme }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
