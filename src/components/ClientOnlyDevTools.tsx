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

  useEffect(() => {
    setIsClient(true);
    
    // Initialize console debug API only in development
    if (process.env.NODE_ENV === 'development') {
      consoleDebugAPI.initialize();
    }
  }, []);

  // Only render in development and on client
  if (!isClient || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <DevMockState />
      <DevToolsPanel />
    </>
  );
}