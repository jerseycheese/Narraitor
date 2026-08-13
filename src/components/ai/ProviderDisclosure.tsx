import React from 'react';
import { clsx } from 'clsx';
import { useProviderDisclosure } from './useProviderDisclosure';
import type { ProviderType } from '@/types/provider.types';
import './provider-config.css';

interface ProviderDisclosureProps {
  type: ProviderType;
  model: string;
  /** What this provider does with prompts and outputs; see PROVIDER_PRESETS. */
  privacyNote?: string;
  className?: string;
}

/**
 * What a provider choice actually costs the player, stated before they commit
 * to one.
 *
 * Two things they can't find out from the provider grid:
 *
 * **Privacy.** Google's free Gemini tier allows prompts and outputs to be used
 * to improve their models and reviewed by human raters; their paid tiers do
 * not. Someone writing personal creative fiction into this app deserves to know
 * that before they paste a key, and it is the strongest single reason
 * bring-your-own-provider exists at all.
 *
 * **Content rating.** On Gemini a world's rating is sent as a safety-filter
 * setting. On every other provider there is nothing to send it to, so it goes
 * in the prompt as guidance — a request to the model, not an enforced filter.
 * Saying so plainly is better than a player discovering it mid-scene.
 */
export function ProviderDisclosure({ type, model, privacyNote, className }: ProviderDisclosureProps) {
  const { contentRatingNote } = useProviderDisclosure(type, model);

  return (
    <div className={clsx('component-provider-disclosure', className)}>
      {privacyNote && (
        <p className="provider-disclosure-item">
          <span className="provider-disclosure-label">Privacy</span>
          {privacyNote}
        </p>
      )}
      <p className="provider-disclosure-item">
        <span className="provider-disclosure-label">Content rating</span>
        {contentRatingNote}
      </p>
    </div>
  );
}
