'use client';

import { useEffect, useState } from 'react';
import { DevToolsPanel } from '@/components/devtools';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

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
