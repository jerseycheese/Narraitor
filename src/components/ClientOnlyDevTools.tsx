'use client';

import { useEffect } from 'react';
import { useFormState } from '@/hooks';
import { DevMockState } from '@/components/devtools/DevMockState';
import { DevToolsPanel } from '@/components/devtools';

/**
 * Client-only wrapper for development tools to prevent hydration mismatches
 */
export function ClientOnlyDevTools() {
  // Client-side state management using hooks
  const devToolsState = useFormState({
    initialData: {
      isClient: false
    }
  });

  useEffect(() => {
    devToolsState.updateField('isClient', true);
  }, [devToolsState.updateField]);

  if (!devToolsState.data.isClient) {
    return null;
  }

  return (
    <>
      <DevMockState />
      <DevToolsPanel />
    </>
  );
}