// src/lib/ai/providers/types.ts

import type { ProviderType } from '@/types/provider.types';
import type { ContentRating } from '../safety/contentRatingGuidance';

/**
 * A fully resolved provider for one request: everything the generic core needs
 * to reach an upstream API, with nothing provider-shaped in it.
 *
 * This is what `resolveProvider` produces from a request's headers, replacing
 * the bare key string the routes used to pass around. `apiKey` is null for
 * keyless providers and for the "nothing configured" case; the core rejects the
 * request rather than calling upstream anonymously.
 *
 * SECURITY: never log a descriptor — it carries the player's plaintext key.
 */
export interface ProviderDescriptor {
  type: ProviderType;
  /** Full upstream URL. Ignored by the Gemini adapter (see gemini/adapter.ts). */
  endpoint: string;
  model: string;
  apiKey: string | null;
}

/**
 * What a route hands a generator so it can build a client.
 *
 * A descriptor is the current form and carries its own model. A bare string is
 * the older Gemini-key-only form, still used by the image routes, which are
 * Gemini-only by design. Accepting both is what let the generators pick up
 * multi-provider support without every one of them changing shape.
 */
export type ProviderCredential = string | ProviderDescriptor;

/**
 * One text generation, described without reference to any provider's wire
 * format. Adapters turn this into a request body.
 */
export interface TextGenerationSpec {
  prompt: string;
  temperature: number;
  maxTokens: number;
  /** Parsed from the prompt; see safety/contentRatingGuidance. */
  contentRating: ContentRating | null;
  stream: boolean;
}

/**
 * Normalized finish reasons. Providers disagree on vocabulary — Gemini says
 * `STOP`/`MAX_TOKENS`, the OpenAI-compatible standard says `stop`/`length` —
 * so adapters map to this set and nothing downstream sees two vocabularies.
 * `OTHER` carries through anything a provider reports that isn't one of these.
 */
export type FinishReason = 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'ERROR' | 'OTHER';

export interface ProviderTextResult {
  content: string;
  finishReason: string;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * Why an adapter could not turn an upstream 200 into a result.
 *
 * `malformed` is a response that didn't have the fields it should have.
 * `moderation` is a response that was well-formed and deliberately empty
 * because the provider refused the content — a case that reads identically to
 * "the model returned nothing" unless the adapter names it (see #890's spike
 * note on `finish_reason: "error"`).
 */
export type ProviderParseFailure = 'malformed' | 'moderation';

export type ProviderParseResult =
  | { ok: true; result: ProviderTextResult }
  | { ok: false; failure: ProviderParseFailure };

/**
 * One decoded streaming frame. The generic core owns the decode loop, the
 * partial-line buffer, the preview extraction and the event protocol; an
 * adapter's only job in streaming is mapping one parsed `data:` payload to
 * this shape. That boundary is where the #1749 spike landed: the reader is
 * provider-generic, the payload inside each frame is not.
 */
export interface ProviderStreamFrame {
  text?: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * The per-provider half of a text request. Everything else — rate limiting,
 * timeouts, streaming mechanics, error responses — lives in the generic core.
 */
export interface ProviderAdapter {
  readonly type: ProviderType;

  /** Absolute URL for this request. `spec.stream` picks the streaming variant. */
  buildUrl(descriptor: ProviderDescriptor, spec: TextGenerationSpec): string;

  /** Auth and content-type headers. SECURITY: the key goes here, never in a URL. */
  buildHeaders(descriptor: ProviderDescriptor): Record<string, string>;

  buildBody(descriptor: ProviderDescriptor, spec: TextGenerationSpec): object;

  /** Map a non-streaming JSON body to a result, or say why it couldn't. */
  parseTextResponse(data: unknown): ProviderParseResult;

  /**
   * Map one parsed SSE `data:` payload to a frame. Returning null skips the
   * frame — an unrecognized payload shape is not worth aborting a turn over.
   */
  parseStreamFrame(payload: unknown): ProviderStreamFrame | null;
}
