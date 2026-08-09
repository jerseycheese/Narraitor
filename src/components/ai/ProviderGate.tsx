'use client';

import { useEffect, useState } from 'react';
import { useProviderStore } from '@/state/providerStore';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';
import { NoProviderModal } from './NoProviderModal';

/**
 * Blocks AI-dependent screens when no provider is configured.
 *
 * Only the public production build blocks. Local dev and the test suites (which
 * set the Playwright flag in-page, whichever server they're served from) fall
 * back to the server env key, so we never block there — that also keeps the
 * modal out of visual baselines. The
 * check waits for the store to hydrate so a saved provider doesn't briefly read
 * as missing.
 */
export function ProviderGate() {
  const providerCount = useProviderStore((s) => Object.keys(s.providers).length);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useProviderStore.persist.hasHydrated());
    return useProviderStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const shouldBlock =
    hydrated &&
    providerCount === 0 &&
    process.env.NODE_ENV === 'production' &&
    !isPlaywrightEnv();

  return <NoProviderModal isOpen={shouldBlock} />;
}
