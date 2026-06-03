'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

// Load the devtools panel only on demand so its module graph is reliably kept
// out of the production bundle — the dev-only render guard below still gates
// whether it ever renders (issue #1357).
const DevToolsPanel = dynamic(
  () => import('@/components/devtools').then((m) => ({ default: m.DevToolsPanel })),
  { ssr: false }
);

/**
 * Client-only wrapper for development tools to prevent hydration mismatches
 */
export function ClientOnlyDevTools() {
  const [isClient, setIsClient] = useState(false);
  const [isPlaywright, setIsPlaywright] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsPlaywright(isPlaywrightEnv());
  }, []);

  // Only render in development and on client
  if (!isClient || process.env.NODE_ENV !== 'development' || isPlaywright) {
    return null;
  }

  return <DevToolsPanel />;
}
