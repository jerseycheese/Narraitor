// src/types/provider.types.ts

/**
 * Types for bring-your-own provider configuration.
 *
 * Only Gemini works end-to-end in this release; the other types exist so the
 * presets UI can list popular services and so the schema is ready for the
 * post-1.0 multi-provider work.
 */

export type ProviderType = 'gemini' | 'openai-compatible' | 'claude' | 'ollama';

export interface ProviderCapabilities {
  text: boolean;
  images: boolean;
  streaming: boolean;
}

/**
 * Power-user overrides for one provider's generation parameters, edited from
 * the collapsed "Advanced" panel on that provider's card.
 *
 * Absent (the whole object, or any field within it) means "use this call
 * site's own default" - the same absent-means-default contract
 * `hasFixedSamplingControls` and `maxOutputTokensParam` already use on
 * `ProviderPreset`. "Reset to defaults" is exactly clearing this object back
 * to undefined, not writing defaults into it.
 *
 * `temperature` / `topP` / `maxTokens` apply to every text generation this
 * provider makes, not per feature - a narrative turn and a background
 * classification call share one override, because a per-provider panel has no
 * way to know which call site is asking. `temperature` and `topP` are still
 * silently dropped for a provider whose preset sets
 * `hasFixedSamplingControls` - see providers/types.ts.
 *
 * `customSafetyPrompt` and `customSystemPrompt` travel with the request's
 * provider descriptor and are applied at the provider boundary, where Gemini
 * and OpenAI-compatible providers have different prompt shapes.
 */
export interface AdvancedSettings {
  /** 0.0-2.0. Higher is more creative/random, lower is more consistent/focused. */
  temperature?: number;
  /** 0.0-1.0 nucleus sampling - an alternative to temperature, rarely tuned alongside it. */
  topP?: number;
  /** Response length cap in tokens. Higher costs more and takes longer per turn. */
  maxTokens?: number;
  /**
   * Replaces the default content-rating guidance sent with a request. Risky:
   * a weaker prompt does not weaken a provider's own safety filtering, and a
   * stronger one is not a substitute for picking the right content rating on
   * the world itself.
   */
  customSafetyPrompt?: string;
  /** Extra system-prompt content appended for this provider only. */
  customSystemPrompt?: string;
  /** Whether the client-side request budget below is enforced. */
  rateLimitEnabled?: boolean;
  /**
   * Requests allowed per rolling hour when `rateLimitEnabled` is true. A
   * safety net against accidentally burning through your own quota - tracked
   * in memory for the current browser session, not persisted or synced with
   * any server-side limit.
   */
  maxRequestsPerHour?: number;
}

/**
 * A saved provider configuration. The API key is stored ONLY as an encrypted
 * payload (serialized {ciphertext, iv}); plaintext never lives here. Keyless
 * providers (e.g. a local Ollama) omit it.
 */
export interface ProviderConfig {
  id: string;
  type: ProviderType;
  /** User-friendly name, e.g. "My Gemini key". */
  name: string;
  endpoint: string;
  encryptedApiKey?: string;
  model: string;
  customHeaders?: Record<string, string>;
  capabilities: ProviderCapabilities;
  /** Power-user generation-parameter overrides; absent means "use the defaults". */
  advancedSettings?: AdvancedSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Result of the last validation check for a provider. lastChecked is epoch ms
 * (a Date would not survive JSON persistence).
 */
export interface ProviderValidationRecord {
  valid: boolean;
  lastChecked: number;
  error?: string;
}

/**
 * A preset shown in the configuration wizard. `available` marks whether the
 * provider actually works in this release (only Gemini for 1.0).
 */
export interface ProviderPreset {
  /** Stable key, e.g. "gemini". */
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  models: string[];
  defaultModel: string;
  capabilities: ProviderCapabilities;
  helpUrl: string;
  available: boolean;
  /**
   * Extra request headers this service wants, e.g. OpenRouter's attribution
   * pair. Attached server-side by matching the endpoint (see resolveProvider)
   * rather than travelling from the browser, and applied under the adapter's
   * own headers, so a preset can never set Authorization or Content-Type. See
   * applyCustomHeaders in providers/core/request.ts.
   */
  customHeaders?: Record<string, string>;
  /**
   * What this service calls the output-length cap, when it isn't `max_tokens`.
   *
   * OpenAI retired `max_tokens` on its current models and rejects the request
   * outright rather than ignoring the field, so this is a hard requirement
   * there, not a preference. Most OpenAI-compatible services still take
   * `max_tokens`, which is why it stays the default and this is opt-in.
   *
   * Keyed to the service rather than the model: every model an OpenAI preset
   * offers is a current one, and a service that has moved has moved wholesale.
   */
  maxOutputTokensParam?: 'max_tokens' | 'max_completion_tokens';
  /**
   * Whether this service's models fix the sampling controls and refuse to be
   * told otherwise.
   *
   * OpenAI's current models are reasoning models: they run their own rounds of
   * generation and selection, so temperature and top_p are locked and the API
   * rejects the request rather than clamping. Sending the default value is not
   * a workaround — the field's presence is what some endpoints reject — so the
   * only correct move is to omit both.
   */
  hasFixedSamplingControls?: boolean;
  /**
   * Whether this service needs a key at all. Absent means yes, which is every
   * hosted service we list.
   *
   * False is for a service the player runs themselves, where there is nobody to
   * bill and nothing to authenticate against. The wizard stops requiring the
   * field, and a blank one is saved as KEYLESS_PROVIDER_KEY rather than as
   * nothing — see providerKeyHeader for why the placeholder is load-bearing.
   */
  requiresApiKey?: boolean;
  /** Short pitch shown under the name, e.g. what a key costs to get. */
  note?: string;
  /**
   * What this provider does with prompts and outputs. Shown in the wizard
   * before a player commits a key — see ProviderDisclosure for why this is
   * surfaced rather than left to the provider's own terms page.
   */
  privacyNote?: string;
}
