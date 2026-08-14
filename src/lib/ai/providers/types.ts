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
  /**
   * Extra headers the service at `endpoint` asks for, taken from its preset.
   *
   * SECURITY: resolved server-side from the endpoint, never read off the
   * request. The endpoint already travels from the browser and is guarded; a
   * second header channel carrying arbitrary names and values would let a
   * caller shape the outbound request itself. Keyed on where the request is
   * going, so one service's headers cannot ride along to another.
   */
  customHeaders?: Record<string, string>;
  /**
   * What this service calls the output-length cap. Resolved from the endpoint's
   * preset; absent means `max_tokens`, which is what nearly every
   * OpenAI-compatible service still takes. See presets.ts.
   */
  maxOutputTokensParam?: 'max_tokens' | 'max_completion_tokens';
  /**
   * Whether this service fixes temperature and top_p and rejects being told
   * otherwise. Resolved from the endpoint's preset. See presets.ts.
   */
  hasFixedSamplingControls?: boolean;
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

/**
 * Finish reasons that mean "the provider refused", not "the model finished".
 *
 * `ERROR` is here because OpenRouter reports a Gemini safety block that way
 * rather than as `content_filter`. Paired with empty content, either one is a
 * refusal — and a refusal is indistinguishable from a model that legitimately
 * said nothing unless it is named.
 */
export const REFUSAL_FINISH_REASONS: ReadonlySet<FinishReason> = new Set<FinishReason>([
  'SAFETY',
  'ERROR',
]);

export interface ProviderTextResult {
  content: string;
  finishReason: FinishReason;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * Why an adapter could not turn an upstream 200 into a result.
 *
 * `malformed` is a response that didn't have the fields it should have.
 * `moderation` is a response that was well-formed and deliberately empty
 * because the provider refused the content — a case that reads identically to
 * "the model returned nothing" unless the adapter names it. OpenRouter reports
 * one as `finish_reason: "error"`.
 */
export type ProviderParseFailure = 'malformed' | 'moderation';

export type ProviderParseResult =
  | { ok: true; result: ProviderTextResult }
  | { ok: false; failure: ProviderParseFailure };

/**
 * One decoded streaming frame. The generic core owns the decode loop, the
 * partial-line buffer, the preview extraction and the event protocol; an
 * adapter's only job in streaming is mapping one parsed `data:` payload to
 * this shape. That boundary is where the streaming spike landed: the reader is
 * provider-generic, the payload inside each frame is not.
 */
export interface ProviderStreamFrame {
  text?: string;
  finishReason?: FinishReason;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * The per-provider half of a text request. Everything else — rate limiting,
 * timeouts, streaming mechanics, error responses — lives in the generic core.
 */
export interface ProviderAdapter {
  readonly type: ProviderType;

  /**
   * Whether `buildUrl` returns a URL the player supplied.
   *
   * SECURITY: the core runs the endpoint guard before any request whose URL is
   * player-supplied. Gemini pins its own base and sets this false, which is why
   * the path every default session uses has no attacker-reachable URL at all.
   */
  readonly playerSuppliedEndpoint: boolean;

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
