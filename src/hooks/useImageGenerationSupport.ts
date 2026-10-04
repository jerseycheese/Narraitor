'use client';

import { useProviderStore } from '@/state/providerStore';
import { supportsImages } from '@/lib/ai/providers/capabilities';

/**
 * Whether the player's active provider can generate images, and what to tell
 * them when it can't.
 *
 * Image generation stays on Gemini, so every other provider falls back to a
 * placeholder. That fallback works — the routes return 200 with a stand-in URL
 * rather than an error — but it used to arrive silently, which reads as a bug
 * in the app rather than as a limit of the provider the player chose.
 *
 * Answered in the browser rather than by the routes: the store already knows
 * which provider is active, and `supportsImages` is a pure function of its type.
 * Threading a reason back through five image routes would buy nothing here.
 *
 * With no provider configured, generation runs on the server's own Gemini key,
 * so images are supported and there is nothing to explain.
 */
export function useImageGenerationSupport(): { supported: boolean; reason: string | null } {
  const activeProviderId = useProviderStore((state) => state.activeProviderId);
  const providers = useProviderStore((state) => state.providers);

  const activeType = activeProviderId ? providers[activeProviderId]?.type : undefined;
  if (!activeType || supportsImages(activeType)) {
    return { supported: true, reason: null };
  }

  return {
    supported: false,
    reason: 'Your provider writes text but does not generate images. Add a Gemini provider to generate them.',
  };
}
