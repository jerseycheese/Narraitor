// Shared utilities for API routes

import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter, RateLimiter, type RateLimitResult } from './rateLimiter';
import { resolveProvider, type ProviderResolutionFailure } from '../lib/ai/resolveApiKey';
import { createAPIErrorResponse } from '../lib/utils/createAPIErrorResponse';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '../lib/constants/aiTimeouts';
import { requireProviderAdapter } from '../lib/ai/providers/adapterRegistry';
import { geminiAdapter } from '../lib/ai/providers/gemini/adapter';
import {
  generateProviderText,
  openProviderTextStream,
  ProviderUpstreamError,
  sendProviderRequest,
} from '../lib/ai/providers/core/request';
import { consumeProviderStreamEvents } from '../lib/ai/providers/core/streamConsumer';
import { parseContentRating } from '../lib/ai/safety/contentRatingGuidance';
import type {
  ProviderAdapter,
  ProviderDescriptor,
  TextGenerationSpec,
} from '../lib/ai/providers/types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ApiHelpers');

/**
 * Route-level plumbing for the AI endpoints: rate limiting, request validation,
 * and turning a generation into an HTTP response.
 *
 * Everything provider-shaped — URLs, request bodies, response parsing, stream
 * framing — now lives under `src/lib/ai/providers/`. This file used to hold all
 * of it inline for Gemini, which is what made adding a second provider a
 * rewrite rather than an addition.
 */

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  );
}

/**
 * Handle rate limiting for API requests
 * Returns both the rate limit result and a NextResponse if rate limit is exceeded
 *
 * Exported for the routes that don't go through processAITextRequest but still
 * make an outbound call on the caller's behalf — see validate-provider.
 */
export function handleRateLimiting(request: NextRequest): {
  response: NextResponse | null;
  result: RateLimitResult;
} {
  const clientIP = getClientIP(request);
  const rateLimitResult = globalRateLimiter.checkLimit(clientIP);

  if (!rateLimitResult.allowed) {
    return {
      response: NextResponse.json(
        {
          error: RateLimiter.getErrorMessage(rateLimitResult.resetTime),
          code: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      ),
      result: rateLimitResult
    };
  }

  return { response: null, result: rateLimitResult };
}

/**
 * Validate basic request structure for AI endpoints
 */
async function validateAIRequest(request: NextRequest): Promise<{
  prompt: string;
  config?: {
    maxTokens?: number;
    temperature?: number;
  };
} | null> {
  try {
    const body = await request.json();

    if (!body.prompt) {
      throw new Error('Prompt is required');
    }

    return body;
  } catch {
    return null;
  }
}

/**
 * Create rate limit headers for successful responses
 * Uses the existing rate limit result to avoid double-counting
 */
function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '50',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  };
}

/**
 * Make a request to Gemini's REST API using header authentication.
 *
 * A Gemini-shaped convenience over the generic `sendProviderRequest`, for the
 * callers that are Gemini-only by design — the validate-provider ping and the
 * image routes. Generation goes through the provider abstraction instead.
 */
export async function makeGeminiRequest(
  endpoint: string,
  apiKey: string,
  payload: object,
  timeoutMs: number = GEMINI_ATTEMPT_TIMEOUT_MS
): Promise<Response> {
  return sendProviderRequest(
    endpoint,
    geminiAdapter.buildHeaders({ type: 'gemini', endpoint, model: '', apiKey }),
    payload,
    // Gemini's URL is built from a pinned base by its callers, never from a
    // header, so there is no player-supplied endpoint to guard here.
    { timeoutMs }
  );
}

/**
 * Options for a text generation request
 */
export interface AITextRequestOptions {
  maxTokens?: number;
  temperature?: number;
  errorContext?: string; // For logging context (e.g., 'Narrative generation', 'Choice generation')
}

/** How a failed provider resolution is reported to the caller. */
const RESOLUTION_ERRORS: Record<ProviderResolutionFailure, { message: string; status: number }> = {
  // Unchanged from before the split: a request with no usable key is a
  // server-configuration problem, not the caller's mistake.
  NO_KEY: { message: 'Service configuration error: API key not configured', status: 500 },
  UNSUPPORTED_PROVIDER: {
    message: '400 bad request: that provider type is not supported yet',
    status: 400,
  },
  INVALID_ENDPOINT: {
    message: '400 bad request: the provider endpoint must be an https URL on a public host',
    status: 400,
  },
  INVALID_MODEL: { message: '400 bad request: no valid model for this provider', status: 400 },
};

/**
 * Everything the two entry points below share: rate limit, validate, resolve
 * the provider, and build the generation spec. Returns either a ready-to-send
 * error response or the pieces needed to generate.
 */
async function prepareTextRequest(
  request: NextRequest,
  options: AITextRequestOptions,
  stream: boolean
): Promise<
  | { ok: false; response: Response }
  | {
      ok: true;
      adapter: ProviderAdapter;
      descriptor: ProviderDescriptor;
      spec: TextGenerationSpec;
      rateLimitResult: RateLimitResult;
    }
> {
  const { maxTokens = 1024, temperature = 0.7 } = options;

  const { response: rateLimitResponse, result: rateLimitResult } = handleRateLimiting(request);
  if (rateLimitResponse) return { ok: false, response: rateLimitResponse };

  const requestData = await validateAIRequest(request);
  if (!requestData) {
    return {
      ok: false,
      response: createAPIErrorResponse(new Error('400 bad request: prompt is required'), 400),
    };
  }

  const resolution = resolveProvider(request);
  if (!resolution.ok) {
    const { message, status } = RESOLUTION_ERRORS[resolution.reason];
    return { ok: false, response: createAPIErrorResponse(new Error(message), status) };
  }

  return {
    ok: true,
    adapter: requireProviderAdapter(resolution.descriptor.type),
    descriptor: resolution.descriptor,
    spec: {
      prompt: requestData.prompt,
      temperature: requestData.config?.temperature || temperature,
      maxTokens: requestData.config?.maxTokens || maxTokens,
      contentRating: parseContentRating(requestData.prompt),
      stream,
    },
    rateLimitResult,
  };
}

/** Turn a thrown provider error into the route's response. */
function toErrorResponse(error: unknown, errorContext: string): Response {
  if (error instanceof ProviderUpstreamError) {
    return createAPIErrorResponse(new Error(error.message), error.status, error.detail);
  }

  logger.error(`${errorContext} error:`, error);
  return createAPIErrorResponse(
    error instanceof Error ? error : new Error('Unknown error occurred'),
    500,
    error instanceof Error ? error.message : 'Unknown error'
  );
}

/**
 * Process a complete text generation request against whichever provider the
 * player has configured. The route calling this doesn't know or care which one
 * that is.
 */
export async function processAITextRequest(
  request: NextRequest,
  options: AITextRequestOptions = {}
): Promise<Response> {
  const { errorContext = 'Generation' } = options;

  const prepared = await prepareTextRequest(request, options, false);
  if (!prepared.ok) return prepared.response;

  try {
    const result = await generateProviderText(prepared.adapter, prepared.descriptor, prepared.spec);

    return NextResponse.json(result, {
      headers: createRateLimitHeaders(prepared.rateLimitResult),
    });
  } catch (error) {
    return toErrorResponse(error, errorContext);
  }
}

/**
 * Streaming counterpart to processAITextRequest: same rate limiting,
 * validation, and provider resolution, but calls the provider's streaming
 * endpoint and forwards narrative content to the client as it's generated
 * instead of waiting for the full response. See NarrativeStreamEvent for the
 * wire protocol. Used only by /api/narrative/generate — the other text routes
 * have no progressive-reveal UI and stay on the simpler path.
 */
export async function processAIStreamingTextRequest(
  request: NextRequest,
  options: AITextRequestOptions = {}
): Promise<Response> {
  const { errorContext = 'Generation' } = options;

  const prepared = await prepareTextRequest(request, options, true);
  if (!prepared.ok) return prepared.response;

  let upstream: Response;
  try {
    upstream = await openProviderTextStream(prepared.adapter, prepared.descriptor, prepared.spec);
  } catch (error) {
    return toErrorResponse(error, errorContext);
  }

  if (!upstream.body) {
    return createAPIErrorResponse(new Error('Service error: empty stream body'), 500);
  }

  const encoder = new TextEncoder();
  const upstreamReader = upstream.body.getReader();
  const adapter = prepared.adapter;

  const ndjsonStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of consumeProviderStreamEvents(upstreamReader, adapter, errorContext)) {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      }
      controller.close();
    },
    cancel() {
      upstreamReader.cancel().catch(() => {});
    },
  });

  return new Response(ndjsonStream, {
    headers: {
      ...createRateLimitHeaders(prepared.rateLimitResult),
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
