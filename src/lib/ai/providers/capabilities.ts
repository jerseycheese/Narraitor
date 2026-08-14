// src/lib/ai/providers/capabilities.ts

import type { ProviderType } from '@/types/provider.types';

/**
 * The handful of provider and model facts that change what we send or show.
 *
 * Deliberately not a capability registry. Narraitor composes one self-contained
 * prompt per turn and sends it as a single user turn, so the differences that
 * could bite a multi-turn conversation — alternating-role rules, message
 * reordering — have no input to act on here. Only quirks with a live consumer
 * are recorded, and each one names that consumer.
 */

/**
 * Model families whose chat template has no system turn. Sending one is a hard
 * API error on these, so the adapter folds the system text into the user turn.
 *
 * Matched as a substring of a lowercased model id: these families ship under a
 * dozen vendor-prefixed names each (`google/gemma-2-9b-it`, `gemma2:9b`), and
 * the quirk belongs to the family rather than to any one listing.
 */
const NO_SYSTEM_ROLE = [
  // Gemma's chat template rejects a system message outright.
  'gemma',
  // Claude takes the system prompt as a separate top-level parameter.
  'anthropic/',
];

/** Whether this model accepts a dedicated `system` message. */
export function hasSystemRole(model: string): boolean {
  const id = model.toLowerCase();
  return !NO_SYSTEM_ROLE.some((family) => id.includes(family));
}

/**
 * Whether the provider has a server-side safety-threshold setting, i.e.
 * Gemini's `safetySettings`. Nothing in the OpenAI-compatible standard
 * corresponds to it, which is why a content rating travels as prompt guidance
 * everywhere else. The provider config UI says so to the player.
 */
export function hasNativeSafetySettings(type: ProviderType): boolean {
  return type === 'gemini';
}

/** Whether the provider can generate images. Image generation stays on Gemini. */
export function supportsImages(type: ProviderType): boolean {
  return type === 'gemini';
}
