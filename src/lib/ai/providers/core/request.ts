// src/lib/ai/providers/core/request.ts

import type {
  ProviderAdapter,
  ProviderDescriptor,
  ProviderTextResult,
  TextGenerationSpec,
} from '../types';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '@/lib/constants/aiTimeouts';
import { assertPublicProviderEndpoint } from '../endpointGuard';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ProviderRequest');

/**
 * The provider-generic half of a text request: transport, timeout, HTTP status
 * classification, and the hand-off to an adapter for anything wire-shaped.
 *
 * Nothing here knows which provider is on the other end. That was the point of
 * the #890 split — `apiHelpers.ts` used to hardcode Gemini's URLs, body shape
 * and response paths in the same functions that did rate limiting and error
 * responses, and none of that survived contact with an OpenAI-shaped API.
 */

/**
 * A request that reached the provider and came back unusable. Carries the HTTP
 * status so the route can pass the upstream's own status through rather than
 * flattening everything to 500.
 */
export class ProviderUpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = 'ProviderUpstreamError';
  }
}

export interface SendProviderRequestOptions {
  timeoutMs?: number;
  /**
   * True when `url` came from the player rather than from a pinned constant.
   * Runs the endpoint guard immediately before the request — at the sink, so no
   * call path can reach `fetch` having skipped it.
   */
  playerSuppliedEndpoint?: boolean;
}

/**
 * POST to a provider with a hard timeout.
 *
 * The thrown messages are load-bearing: `getUserFriendlyError` classifies on
 * "timeout" and "network" substrings, so a rewording here changes what the
 * player sees.
 */
export async function sendProviderRequest(
  url: string,
  headers: Record<string, string>,
  body: object,
  options: SendProviderRequestOptions = {}
): Promise<Response> {
  const { timeoutMs = GEMINI_ATTEMPT_TIMEOUT_MS, playerSuppliedEndpoint = false } = options;

  if (playerSuppliedEndpoint) {
    await assertPublicProviderEndpoint(url);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // SECURITY: `redirect: 'error'` is doing real work here, not tidiness.
    // Without it a public host that passes the guard can answer 302 to
    // http://169.254.169.254/ and fetch follows it without re-checking
    // anything. No provider's chat-completions endpoint legitimately redirects.
    //
    // codeql[js/request-forgery] The URL is player-supplied by design — this is
    // bring-your-own-provider, and the feature cannot exist without fetching a
    // URL the player named. It is constrained by assertPublicProviderEndpoint
    // above (https only, no private literals, every resolved address checked)
    // and redirects are refused. See endpointGuard's header comment for what
    // that does and does not close.
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      redirect: 'error',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      if (err.message.includes('network') || err.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
    }

    throw err;
  }
}

/**
 * Map an upstream HTTP status onto an error the route can return.
 *
 * 429 and 401 reproduce the pre-split Gemini mapping exactly. 403 is added
 * because OpenAI-compatible providers reject a bad key that way where Gemini
 * uses 400 — without it, an invalid key on those providers reads to the player
 * as a generic service failure.
 */
export function classifyUpstreamStatus(status: number, statusText: string): Error {
  if (status === 429) return new Error('429 rate limit exceeded');
  if (status === 401 || status === 403) return new Error('401 unauthorized');
  return new Error(`Service error: ${status} ${statusText}`);
}

/** Human-readable reasons for the two ways a 200 can still be unusable. */
const PARSE_FAILURES = {
  malformed: {
    message: 'Service error: malformed API response',
    detail: 'Provider response was missing the generated content',
  },
  moderation: {
    message: 'Service error: the provider blocked this content',
    detail: 'The provider returned an empty response and reported a content block',
  },
} as const;

/**
 * Open a streaming text request. Returns the raw upstream response for the
 * caller to hand to `consumeProviderStreamEvents`; throws
 * ProviderUpstreamError when the provider answered with a failure status.
 */
export async function openProviderTextStream(
  adapter: ProviderAdapter,
  descriptor: ProviderDescriptor,
  spec: TextGenerationSpec,
  timeoutMs?: number
): Promise<Response> {
  const response = await sendProviderRequest(
    adapter.buildUrl(descriptor, spec),
    adapter.buildHeaders(descriptor),
    adapter.buildBody(descriptor, spec),
    { timeoutMs, playerSuppliedEndpoint: adapter.playerSuppliedEndpoint }
  );

  if (!response.ok) throw await toUpstreamError(adapter, response);
  return response;
}

/**
 * Run one non-streaming text generation end to end.
 *
 * Throws ProviderUpstreamError for a provider-side failure and a plain Error
 * for transport failures, which is the same shape the routes already handle.
 */
export async function generateProviderText(
  adapter: ProviderAdapter,
  descriptor: ProviderDescriptor,
  spec: TextGenerationSpec,
  timeoutMs?: number
): Promise<ProviderTextResult> {
  const response = await sendProviderRequest(
    adapter.buildUrl(descriptor, spec),
    adapter.buildHeaders(descriptor),
    adapter.buildBody(descriptor, spec),
    { timeoutMs, playerSuppliedEndpoint: adapter.playerSuppliedEndpoint }
  );

  if (!response.ok) throw await toUpstreamError(adapter, response);

  const parsed = adapter.parseTextResponse(await response.json());
  if (parsed.ok) return parsed.result;

  const { message, detail } = PARSE_FAILURES[parsed.failure];
  logger.error('Provider response could not be parsed', {
    provider: adapter.type,
    failure: parsed.failure,
  });
  throw new ProviderUpstreamError(message, 500, detail);
}

/**
 * How much of an upstream error body to keep.
 *
 * SECURITY: for a custom endpoint this body is written by that service, and a
 * provider that echoes the request back would put the bearer credential and the
 * prompt in it. It is never logged, and only a bounded slice reaches the player
 * — enough to carry "model not found" or "insufficient quota", not enough to be
 * a channel.
 */
const MAX_UPSTREAM_DETAIL = 300;

/** Read the upstream error body once and turn it into a typed error. */
async function toUpstreamError(
  adapter: ProviderAdapter,
  response: Response
): Promise<ProviderUpstreamError> {
  const errorText = await response.text().catch(() => '');

  // Deliberately logs the shape of the failure, not its content.
  logger.error('Provider API error', {
    provider: adapter.type,
    status: response.status,
    statusText: response.statusText,
    detailLength: errorText.length,
  });

  const classified = classifyUpstreamStatus(response.status, response.statusText);
  return new ProviderUpstreamError(
    classified.message,
    response.status,
    errorText.slice(0, MAX_UPSTREAM_DETAIL)
  );
}
