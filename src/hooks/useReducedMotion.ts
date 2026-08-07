import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// jsdom (the test environment) doesn't implement matchMedia, so every caller
// needs this guard rather than assuming browser support.
const supportsMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/**
 * Tracks the OS-level "reduce motion" preference (#1678). CSS handles the
 * animation/transition side via the global media query in globals.css; this
 * hook exists only for the JS-driven motion that query can't reach --
 * react-joyride's scroll animation and the manual auto-scroll in
 * useTutorialAutoScroll.ts.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() =>
    supportsMatchMedia() ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    if (!supportsMatchMedia()) return;

    const mediaQueryList = window.matchMedia(QUERY);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) =>
      setPrefersReduced(event.matches);

    handleChange(mediaQueryList);
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
