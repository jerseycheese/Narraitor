'use client';

import React, { useSyncExternalStore } from 'react';
import { ErrorBlock } from '@/components/shared/ErrorBlock';
import { Button } from '@/components/ui/button';
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
 * Surfaces a persistent warning whenever this tab stops saving: browser
 * storage (IndexedDB) failed and fell back to memory, or another tab saved
 * newer data. Either way players need to know their progress won't be kept.
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

  if (!status && !notice) {
    return null;
  }

  const isStale = status === StorageStatus.STALE;

  // ResilientStorageMiddleware already logs the underlying failure (blocked
  // IndexedDB, quota, read/write error), so the banner stays on what the
  // player can actually do about it.
  const message = isStale
    ? "Another tab saved newer changes, so this tab has stopped saving. Reload it to carry on. Anything that didn't save here will be lost."
    : "Narraitor can't save to this browser right now. Keep this tab open, and export your data from Settings so you don't lose your progress.";

  return (
    <aside
      className={`storage-fallback-banner ${className ?? ''}`.trim()}
      role="alert"
      aria-live="polite"
      data-testid="storage-fallback-banner"
    >
      <ErrorBlock errors={[message]} />
      {isStale && (
        <Button
          className="storage-fallback-reload"
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      )}
    </aside>
  );
}
