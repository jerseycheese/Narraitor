// Shared utilities for API routes

import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter, RateLimiter, type RateLimitResult } from './rateLimiter';
import { getAIConfig } from '../lib/ai/config';
import { resolveApiKey } from '../lib/ai/resolveApiKey';
import { createAPIErrorResponse } from '../lib/utils/createAPIErrorResponse';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '../lib/constants/aiTimeouts';
import { extractStreamingContentPreview } from '../lib/ai/narrativeStreamPreview';
import type { NarrativeStreamEvent } from '../lib/ai/types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ApiHelpers');

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
 */
function handleRateLimiting(request: NextRequest): {
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

// Harm categories are always returned in this order; per-rating thresholds line up by index.
const HARM_CATEGORIES = [
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
] as const;

const MEDIUM = 'BLOCK_MEDIUM_AND_ABOVE';
const HIGH = 'BLOCK_ONLY_HIGH';
const NONE = 'BLOCK_NONE';

// Thresholds per content rating, ordered [sexual, hate, harassment, dangerous].
const RATING_THRESHOLDS: Record<string, readonly [string, string, string, string]> = {
  g: [MEDIUM, MEDIUM, MEDIUM, MEDIUM],
  pg: [HIGH, HIGH, HIGH, HIGH],
  'pg-13': [HIGH, HIGH, HIGH, HIGH],
  r: [NONE, HIGH, HIGH, HIGH],
  'nc-17': [NONE, HIGH, NONE, HIGH],
};

const DEFAULT_THRESHOLDS: readonly [string, string, string, string] = [MEDIUM, MEDIUM, MEDIUM, MEDIUM];

/**
 * Extract tone settings from prompt and return appropriate safety settings
 */
export function getSafetySettingsFromPrompt(prompt: string): Array<{
  category: string;
  threshold: string;
}> {
  const contentRatingMatch = prompt.match(/((?:PG-13|NC-17|[A-Z]+))(?:-RATED)? CONTENT GUIDELINES/i);
  const contentRating = contentRatingMatch?.[1]?.toLowerCase() || '';

  const thresholds = RATING_THRESHOLDS[contentRating] ?? DEFAULT_THRESHOLDS;
  return HARM_CATEGORIES.map((category, i) => ({ category, threshold: thresholds[i] }));
}


/**
 * Make secure request to Gemini API using header authentication
 * Includes AbortController for timeout handling
 */
export async function makeGeminiRequest(
  endpoint: string,
  apiKey: string,
  payload: object,
  timeoutMs: number = GEMINI_ATTEMPT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);

    // Enhanced error handling for common scenarios
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
 * Response structure for Gemini text generation
 */
interface GeminiTextResponse {
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  error?: string;
  details?: string;
  code?: string;
}

/**
 * Options for Gemini text generation
 */
export interface GeminiTextOptions {
  maxTokens?: number;
  temperature?: number;
  errorContext?: string; // For logging context (e.g., 'Narrative generation', 'Choice generation')
}

/**
 * Process a complete Gemini text generation request
 * Handles rate limiting, validation, API call, and response parsing
 */
export async function processGeminiTextRequest(
  request: NextRequest,
  options: GeminiTextOptions = {}
): Promise<Response> {
  const {
    maxTokens = 1024,
    temperature = 0.7,
    errorContext = 'Generation'
  } = options;

  try {
    // Rate limiting
    const { response: rateLimitResponse, result: rateLimitResult } = handleRateLimiting(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate request
    const requestData = await validateAIRequest(request);
    if (!requestData) {
      return createAPIErrorResponse(
        new Error('400 bad request: prompt is required'),
        400
      );
    }

    // Resolve the effective key: the player's BYO key (header) -> env fallback.
    const apiKey = resolveApiKey(request);
    if (!apiKey) {
      return createAPIErrorResponse(
        new Error('Service configuration error: API key not configured'),
        500
      );
    }

    // Call Google's Gemini API from the server using secure header authentication
    const response = await makeGeminiRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/${getAIConfig().modelName}:generateContent`,
      apiKey,
      {
        contents: [{
          parts: [{ text: requestData.prompt }]
        }],
        generationConfig: {
          temperature: requestData.config?.temperature || temperature,
          topP: 1.0,
          topK: 40,
          maxOutputTokens: requestData.config?.maxTokens || maxTokens,
          // Disable gemini-2.5-flash dynamic thinking: it adds latency and eats
          // into the (small) maxOutputTokens budget meant for visible prose.
          thinkingConfig: { thinkingBudget: 0 }
        },
        safetySettings: getSafetySettingsFromPrompt(requestData.prompt)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });

      // Create appropriate error based on status code
      const apiError = response.status === 429
        ? new Error('429 rate limit exceeded')
        : response.status === 401
        ? new Error('401 unauthorized')
        : new Error(`Service error: ${response.status} ${response.statusText}`);

      return createAPIErrorResponse(apiError, response.status, errorText);
    }

    const data = await response.json();

    // Extract content from response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      logger.error('API Response structure issue:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasFirstCandidate: !!data.candidates?.[0],
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts
      });

      return createAPIErrorResponse(
        new Error('Service error: malformed API response'),
        500,
        'Missing candidates, content, or parts in response'
      );
    }

    const content = data.candidates[0].content.parts[0]?.text || '';
    const finishReason = data.candidates[0].finishReason || 'STOP';

    // Extract token usage if available
    const promptTokens = data.usageMetadata?.promptTokenCount || undefined;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || undefined;

    const responseData: GeminiTextResponse = {
      content,
      finishReason,
      promptTokens,
      completionTokens
    };

    return NextResponse.json(responseData, {
      headers: createRateLimitHeaders(rateLimitResult)
    });

  } catch (error) {
    logger.error(`${errorContext} error:`, error);

    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Unknown error occurred'),
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/** Minimal shape needed to drive the SSE parser — matches a real
 * ReadableStreamDefaultReader<Uint8Array>, but kept structural so tests can
 * hand it a plain object instead of constructing a real web ReadableStream. */
interface ByteStreamReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
}

/**
 * Consumes a Gemini `:streamGenerateContent?alt=sse` response body and
 * yields our own narrative streaming protocol events (see
 * NarrativeStreamEvent). Each `data:` SSE frame's text delta is accumulated
 * into the raw buffer; extractStreamingContentPreview recovers whatever of
 * the "content" JSON field is decodable so far, and only the newly-revealed
 * suffix is yielded as a delta — recomputing from scratch each time means a
 * chunk that lands mid-escape-sequence just withholds output until the next
 * chunk resolves it, instead of ever yielding a mangled character.
 *
 * Kept independent of the real ReadableStream/Response constructors (which
 * jsdom's jest environment doesn't provide) so it's unit-testable with a
 * hand-rolled reader.
 */
export async function* consumeGeminiStreamEvents(
  reader: ByteStreamReader,
  errorContext: string
): AsyncGenerator<NarrativeStreamEvent> {
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let rawContent = '';
  let visiblePreview = '';
  let finishReason = 'STOP';
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      // The last element may be a partial line still being written — hold it
      // back in the buffer until more bytes complete it.
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice('data:'.length).trim();
        if (!payload || payload === '[DONE]') continue;

        let parsed: {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
          };
        };
        try {
          parsed = JSON.parse(payload);
        } catch {
          // An unparsable SSE frame is skipped rather than aborting the
          // whole turn — the next frame (or the final done event, built
          // from whatever text did arrive) carries the turn forward.
          continue;
        }

        const candidate = parsed.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (typeof text === 'string') {
          rawContent += text;
          const nextPreview = extractStreamingContentPreview(rawContent);
          // Only ever emit a delta when the new preview grows the previous
          // one by appending characters. extractStreamingContentPreview is
          // recomputed from scratch each call and is meant to be monotonic,
          // but this guard keeps a future edge case there from slicing a
          // false prefix off content that never actually preceded it, which
          // would otherwise corrupt the reveal (see #1717 review).
          if (
            nextPreview.length > visiblePreview.length &&
            nextPreview.startsWith(visiblePreview)
          ) {
            yield { delta: nextPreview.slice(visiblePreview.length) };
            visiblePreview = nextPreview;
          }
        }
        if (candidate?.finishReason) {
          finishReason = candidate.finishReason;
        }
        if (parsed.usageMetadata) {
          promptTokens = parsed.usageMetadata.promptTokenCount ?? promptTokens;
          completionTokens = parsed.usageMetadata.candidatesTokenCount ?? completionTokens;
        }
      }
    }

    yield {
      done: true,
      content: rawContent,
      finishReason,
      promptTokens,
      completionTokens,
    };
  } catch (error) {
    logger.error(`${errorContext} stream error:`, error);
    yield {
      error: error instanceof Error ? error.message : 'Stream interrupted',
    };
  }
}

/**
 * Streaming counterpart to processGeminiTextRequest: same rate limiting,
 * validation, and key resolution, but calls Gemini's SSE streaming endpoint
 * and forwards narrative content to the client as it's generated instead of
 * waiting for the full response. See NarrativeStreamEvent for the wire
 * protocol. Used only by /api/narrative/generate — the other Gemini text
 * routes (choices, ending, summarize) have no progressive-reveal UI and stay
 * on the simpler processGeminiTextRequest.
 */
export async function processGeminiStreamingTextRequest(
  request: NextRequest,
  options: GeminiTextOptions = {}
): Promise<Response> {
  const {
    maxTokens = 1024,
    temperature = 0.7,
    errorContext = 'Generation'
  } = options;

  const { response: rateLimitResponse, result: rateLimitResult } = handleRateLimiting(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestData = await validateAIRequest(request);
  if (!requestData) {
    return createAPIErrorResponse(
      new Error('400 bad request: prompt is required'),
      400
    );
  }

  const apiKey = resolveApiKey(request);
  if (!apiKey) {
    return createAPIErrorResponse(
      new Error('Service configuration error: API key not configured'),
      500
    );
  }

  let upstream: Response;
  try {
    upstream = await makeGeminiRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/${getAIConfig().modelName}:streamGenerateContent?alt=sse`,
      apiKey,
      {
        contents: [{
          parts: [{ text: requestData.prompt }]
        }],
        generationConfig: {
          temperature: requestData.config?.temperature || temperature,
          topP: 1.0,
          topK: 40,
          maxOutputTokens: requestData.config?.maxTokens || maxTokens,
          thinkingConfig: { thinkingBudget: 0 }
        },
        safetySettings: getSafetySettingsFromPrompt(requestData.prompt)
      }
    );
  } catch (error) {
    logger.error(`${errorContext} error:`, error);
    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Unknown error occurred'),
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  if (!upstream.ok) {
    const errorText = await upstream.text();
    logger.error('Gemini API Error:', {
      status: upstream.status,
      statusText: upstream.statusText,
      errorText
    });

    const apiError = upstream.status === 429
      ? new Error('429 rate limit exceeded')
      : upstream.status === 401
      ? new Error('401 unauthorized')
      : new Error(`Service error: ${upstream.status} ${upstream.statusText}`);

    return createAPIErrorResponse(apiError, upstream.status, errorText);
  }

  if (!upstream.body) {
    return createAPIErrorResponse(
      new Error('Service error: empty stream body'),
      500
    );
  }

  const encoder = new TextEncoder();
  const upstreamReader = upstream.body.getReader();

  const ndjsonStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of consumeGeminiStreamEvents(upstreamReader, errorContext)) {
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
      ...createRateLimitHeaders(rateLimitResult),
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
