'use client';

import React, { useSyncExternalStore } from 'react';
import { ErrorBlock } from '@/components/shared/ErrorBlock';
import {
  getStorageFallbackNotice,
  getStorageStatus,
  subscribeStorageStatus,
} from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';

interface StorageFallbackBannerProps {
  className?: string;
}

/**
 * Surfaces a persistent warning whenever browser storage (IndexedDB)
 * fails and storage falls back to memory. Memory storage won't survive
 * a page reload, so players need to know their progress won't be saved.
 */
export function StorageFallbackBanner({ className }: StorageFallbackBannerProps) {
  const notice = useSyncExternalStore(
    subscribeStorageStatus,
    getStorageFallbackNotice,
    () => null
  );
  const status = useSyncExternalStore(
    subscribeStorageStatus,
    getStorageStatus,
    () => null
  );

  if (typeof window === 'undefined') {
    return null;
  }

  if (status !== StorageStatus.UNAVAILABLE && !notice) {
    return null;
  }

  const message = notice?.message
    ? `Storage is unavailable (${notice.message}). Progress will not be saved.`
    : 'Storage is unavailable. Progress will not be saved.';

  return (
    <aside
      className={`storage-fallback-banner ${className ?? ''}`.trim()}
      role="alert"
      aria-live="polite"
      data-testid="storage-fallback-banner"
    >
      <ErrorBlock errors={[message]} />
    </aside>
  );
}
