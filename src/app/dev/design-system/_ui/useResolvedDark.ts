'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks whether the page is currently in dark mode by mirroring the `.dark`
 * class on <html> (issue: DS showcase dark-mode bug).
 *
 * The design-system showcase wrappers (`.ds-components`, `.ds-overlay`,
 * `.ds-session`) re-scope `data-theme` onto a local <div>. The theme token CSS
 * scopes its dark overrides to the same element — `[data-theme="dsX"].dark` —
 * so a wrapper that carries `data-theme` but not `.dark` never picks up the
 * dark tokens, even though <html> is dark. These wrappers use this hook to also
 * carry `.dark` so the dark overrides compose inside the forced subtree.
 *
 * We read `.dark` off <html> rather than `useTheme().resolvedColorScheme`
 * because the standalone DS pages have their own local Light/Dark toggle that
 * mutates `document.documentElement.classList` directly (bypassing the
 * ThemeProvider). `<html>.dark` is the one signal every writer converges on —
 * the global ThemeProvider effect, system-preference changes, and the page's
 * own toggle button. A MutationObserver on the class attribute catches them all
 * reactively while the page stays open.
 */
export function useResolvedDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
