// src/lib/ai/providers/capabilities.ts

import type { ProviderType } from '@/types/provider.types';

/**
 * What a given provider/model pair can actually do.
 *
 * Kept per-model rather than per-provider because the differences that bite are
 * per-model: one OpenAI-compatible endpoint serves models that take a system
 * role and models that don't, and routing a request through the wrong
 * assumption fails at the API rather than degrading.
 *
 * Only quirks that change what we send are recorded here. This is a lookup
 * table, not an inventory of every provider's feature list.
 */
export interface ModelCapabilities {
  /** Token-by-token streaming. Falls back to a single response when false. */
  streaming: boolean;
  /** Image generation. Text-only for now (#878 keeps images on Gemini). */
  images: boolean;
  /** Server-enforced JSON output (response_format / responseMimeType). */
  jsonMode: boolean;
  /** A dedicated `system` role. When false the system text is folded into the first user turn. */
  systemRole: boolean;
  /** Rejects consecutive same-role messages; requires user/assistant to alternate. */
  alternatingTurns: boolean;
  /** A provider-side safety-threshold setting, i.e. Gemini's `safetySettings`. */
  nativeSafetySettings: boolean;
}

const OPENAI_COMPATIBLE_DEFAULTS: ModelCapabilities = {
  streaming: true,
  images: false,
  jsonMode: true,
  systemRole: true,
  alternatingTurns: false,
  // Nothing in the OpenAI-compatible standard corresponds to safetySettings.
  // OpenRouter forwards Gemini's as a top-level field, but that is undocumented
  // and unlisted in supported_parameters, so it isn't claimed here.
  nativeSafetySettings: false,
};

const DEFAULTS: Record<ProviderType, ModelCapabilities> = {
  gemini: {
    streaming: true,
    images: true,
    jsonMode: true,
    systemRole: true,
    alternatingTurns: false,
    nativeSafetySettings: true,
  },
  'openai-compatible': OPENAI_COMPATIBLE_DEFAULTS,
  claude: {
    ...OPENAI_COMPATIBLE_DEFAULTS,
    // Anthropic takes the system prompt as a separate top-level parameter, not
    // as a message, and rejects consecutive same-role turns.
    systemRole: false,
    alternatingTurns: true,
  },
  ollama: {
    ...OPENAI_COMPATIBLE_DEFAULTS,
    // Local models vary too much to promise server-enforced JSON.
    jsonMode: false,
  },
};

/**
 * Per-model overrides, matched against a lowercased model id by substring.
 *
 * Substring rather than exact id because these families ship under a dozen
 * vendor-prefixed names each (`google/gemma-2-9b-it`, `gemma2:9b`, …) and the
 * quirk belongs to the family, not to any one listing.
 */
const MODEL_OVERRIDES: ReadonlyArray<{
  match: string;
  capabilities: Partial<ModelCapabilities>;
  /** Why this entry exists, so a stale one can be recognised as stale. */
  reason: string;
}> = [
  {
    match: 'gemma',
    capabilities: { systemRole: false },
    reason: "Gemma's chat template has no system turn; a system message is rejected.",
  },
  {
    match: 'mistral',
    capabilities: { alternatingTurns: true },
    reason: 'Mistral rejects consecutive same-role messages.',
  },
  {
    match: 'mixtral',
    capabilities: { alternatingTurns: true },
    reason: 'Mixtral shares the Mistral chat template.',
  },
  {
    match: 'anthropic/',
    capabilities: { systemRole: false, alternatingTurns: true },
    reason: 'Claude models keep the system prompt out of the message list and require alternating turns.',
  },
];

/**
 * Capabilities for a provider/model pair. An unknown model gets its provider's
 * defaults, which is the right failure mode: the defaults describe the
 * standard, and only models that deviate from it need an entry.
 */
export function getModelCapabilities(type: ProviderType, model: string): ModelCapabilities {
  const base = DEFAULTS[type] ?? OPENAI_COMPATIBLE_DEFAULTS;
  const id = model.toLowerCase();

  return MODEL_OVERRIDES.reduce<ModelCapabilities>(
    (capabilities, override) =>
      id.includes(override.match) ? { ...capabilities, ...override.capabilities } : capabilities,
    base
  );
}
