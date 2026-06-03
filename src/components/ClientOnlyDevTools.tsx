'use client';

import { useEffect, useState } from 'react';
import { DevToolsPanel } from '@/components/devtools';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

/**
 * Client-only wrapper for development tools to prevent hydration mismatches
 */
export function ClientOnlyDevTools() {
  const [isClient, setIsClient] = useState(false);
  const [isAutomated, setIsAutomated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Suppress the dev panel under any automation, not just specs that set the
    // __PLAYWRIGHT__ flag. Some visual specs reuse a seeded storageState that
    // doesn't carry that flag, so without the navigator.webdriver fallback the
    // panel leaks into their fullPage baselines. webdriver is true in automated
    // browsers and false for real users. Kept separate from isPlaywrightEnv so
    // render-path gating (AI generation, etc.) is unaffected.
    setIsAutomated(isPlaywrightEnv() || navigator.webdriver === true);
  }, []);

  // Only render in development and on client
  if (!isClient || process.env.NODE_ENV !== 'development' || isAutomated) {
    return null;
  }

  return <DevToolsPanel />;
}
