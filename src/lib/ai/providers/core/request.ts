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
 * the split — `apiHelpers.ts` used to hardcode Gemini's URLs, body shape
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
    readonly status: number
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
  /**
   * Extra headers the destination service asks for, from its preset. Merged
   * beneath `headers`; see applyCustomHeaders for what they cannot set.
   */
  customHeaders?: Record<string, string>;
}

/**
 * Header names a preset can never set.
 *
 * Compared lowercased because HTTP header names are case-insensitive while a
 * JavaScript object's keys are not. Spread order alone would let a preset
 * naming `authorization` in lower case sit alongside the adapter's
 * `Authorization`: two entries in the object, both reaching `fetch`, and the
 * player's key either replaced or combined with whatever the preset supplied.
 * Matching on the lowercased name is what makes "the adapter's auth wins" true
 * rather than nearly true.
 */
const RESERVED_HEADERS = new Set(['authorization', 'content-type']);

/**
 * Merge a preset's custom headers underneath the adapter's own.
 *
 * SECURITY: done here at the sink for the same reason the endpoint guard is:
 * no call path can reach `fetch` having skipped it, so a future adapter cannot
 * forget to do this correctly. The adapter's headers carry the player's key and
 * declare how the body is encoded; a preset must not be able to redirect that
 * credential or change how the request is read, so reserved names are dropped
 * outright rather than merely losing the merge.
 *
 * Header values are never logged here or anywhere below, since Authorization
 * is the player's plaintext key.
 */
function applyCustomHeaders(
  headers: Record<string, string>,
  customHeaders?: Record<string, string>
): Record<string, string> {
  if (!customHeaders) return headers;

  const allowed = Object.entries(customHeaders).filter(
    ([name]) => !RESERVED_HEADERS.has(name.trim().toLowerCase())
  );
  if (allowed.length === 0) return headers;

  return { ...Object.fromEntries(allowed), ...headers };
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
  const { timeoutMs = GEMINI_ATTEMPT_TIMEOUT_MS, playerSuppliedEndpoint = false, customHeaders } = options;

  if (playerSuppliedEndpoint) {
    await assertPublicProviderEndpoint(url);
  }

  const requestHeaders = applyCustomHeaders(headers, customHeaders);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // SECURITY: `redirect: 'error'` is doing real work here, not tidiness.
    // Without it a public host that passes the guard can answer 302 to
    // http://169.254.169.254/ and fetch follows it without re-checking
    // anything. No provider's chat-completions endpoint legitimately redirects.
    //
    // CodeQL reports this line as server-side request forgery, and it is right
    // that the URL is player-supplied — that is what bring-your-own-provider
    // means, and the feature cannot exist without fetching a URL the player
    // named. The alert is accepted rather than fixed, on these grounds:
    // assertPublicProviderEndpoint above (https only, no private literals,
    // every resolved address checked), redirects refused, and the response body
    // bounded before it reaches the caller. The residual gap is DNS rebinding —
    // see endpointGuard's header comment, which states it plainly.
    //
    // The acceptance is recorded as a dismissal on the alert itself. Inline
    // `codeql[...]` comments do nothing on GitHub code scanning, so one here
    // would look like a control while being decoration.
    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
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
function classifyUpstreamStatus(status: number, statusText: string): Error {
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
    {
      timeoutMs,
      playerSuppliedEndpoint: adapter.playerSuppliedEndpoint,
      customHeaders: descriptor.customHeaders,
    }
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
    {
      timeoutMs,
      playerSuppliedEndpoint: adapter.playerSuppliedEndpoint,
      customHeaders: descriptor.customHeaders,
    }
  );

  if (!response.ok) throw await toUpstreamError(adapter, response);

  const parsed = adapter.parseTextResponse(await response.json());
  if (parsed.ok) return parsed.result;

  const { message } = PARSE_FAILURES[parsed.failure];
  logger.error('Provider response could not be parsed', {
    provider: adapter.type,
    failure: parsed.failure,
  });
  throw new ProviderUpstreamError(message, 500);
}

/** Read the upstream error status and turn it into a typed error without retaining the raw body. */
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
  return new ProviderUpstreamError(classified.message, response.status);
}
