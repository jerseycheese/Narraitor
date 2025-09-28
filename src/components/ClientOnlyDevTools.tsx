'use client';

import { useEffect, useState } from 'react';
import { DevMockState } from '@/components/devtools/DevMockState';
import { DevToolsPanel } from '@/components/devtools';
import { consoleDebugAPI } from '@/lib/devtools/consoleDebugAPI';

/**
 * Client-only wrapper for development tools to prevent hydration mismatches
 */
export function ClientOnlyDevTools() {
  const [isClient, setIsClient] = useState(false);
  const [isPlaywright, setIsPlaywright] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window === 'undefined') {
      return;
    }

    const playwrightFlag = Boolean((window as typeof window & { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__);
    setIsPlaywright(playwrightFlag);

    // Initialize console debug API only when dev tools are enabled
    if (process.env.NODE_ENV === 'development' && !playwrightFlag) {
      consoleDebugAPI.initialize();
    }
  }, []);

  // Only render in development and on client
  if (!isClient || process.env.NODE_ENV !== 'development' || isPlaywright) {
    return null;
  }

  return (
    <>
      <DevMockState />
      <DevToolsPanel />
    </>
  );
}
