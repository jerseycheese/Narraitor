'use client';

import { useSyncExternalStore } from 'react';
import { getProviderHydration, subscribeProviderHydration } from '@/state/providerStore';

/**
 * Hook to track whether provider store persistence has loaded from storage.
 * Does not update persisted state or trigger storage writes.
 */
export function useProviderHydration(): boolean {
  return useSyncExternalStore(
    subscribeProviderHydration,
    getProviderHydration,
    () => false
  );
}
