import { useMemo } from 'react';
import { getModelCapabilities } from '@/lib/ai/providers/capabilities';
import { describeContentRatingEnforcement } from '@/lib/ai/safety/contentRatingGuidance';
import type { ProviderType } from '@/types/provider.types';

/**
 * The mediating layer between ProviderDisclosure and the AI layer.
 *
 * Components don't reach into `lib/ai` directly (see the
 * components-no-direct-lib-imports boundary); a colocated `use*` hook is the
 * sanctioned seam, and it keeps the capability lookup out of render.
 */
export function useProviderDisclosure(type: ProviderType, model: string): {
  contentRatingNote: string;
} {
  return useMemo(() => {
    const { nativeSafetySettings } = getModelCapabilities(type, model);
    return { contentRatingNote: describeContentRatingEnforcement(nativeSafetySettings) };
  }, [type, model]);
}
