// src/types/provider.types.ts

/**
 * Types for bring-your-own provider configuration.
 *
 * Only Gemini works end-to-end in this release; the other types exist so the
 * presets UI can list popular services and so the schema is ready for the
 * post-1.0 multi-provider work (epic #878).
 */

export type ProviderType = 'gemini' | 'openai-compatible' | 'claude' | 'ollama';

export interface ProviderCapabilities {
  text: boolean;
  images: boolean;
  streaming: boolean;
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
