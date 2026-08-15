// src/app/api/ai/validate-provider/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { handleRateLimiting, makeGeminiRequest } from '@/utils/apiHelpers';
import { DEFAULT_TEXT_MODEL, getSafetySettings } from '@/lib/ai/config';
import { PROVIDER_API_KEY_HEADER } from '@/lib/ai/providerKeyHeader';
import { getProviderAdapter } from '@/lib/ai/providers/adapterRegistry';
import { isSafeProviderEndpoint } from '@/lib/ai/providers/endpointGuard';
import {
  presetHeadersForEndpoint,
  presetMaxOutputTokensParamForEndpoint,
} from '@/lib/ai/presets';
import { sendProviderRequest } from '@/lib/ai/providers/core/request';
import { supportsImages } from '@/lib/ai/providers/capabilities';
import type { ProviderType } from '@/types/provider.types';

/**
 * Validates a provider configuration WITHOUT storing the key server-side.
 *
 * The candidate key arrives in the PROVIDER_API_KEY_HEADER (read directly, not
 * via the env fallback — we want to test exactly what the player typed). We make
 * one cheap text ping to the provider and map the upstream status to a stable
 * result. The key is never logged, never persisted, and never echoed back.
 *
 * This covers every provider type the adapter registry can reach, not just
 * Gemini. Types with no adapter still report UNSUPPORTED_PROVIDER.
 */

// Vercel function budget: one single-attempt provider ping (30s) + overhead.
export const maxDuration = 60;

const GEMINI_MODELS_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** One ping should answer "does this key work", not generate anything. */
const PING_TIMEOUT_MS = 10000;

/**
 * Small, but not 1. On a reasoning model this cap counts the model's own
 * reasoning tokens as well as the visible ones, so a cap of 1 leaves it no room
 * to do anything before it stops. The answer we want here is the HTTP status,
 * not the text, and a handful of tokens costs nothing.
 */
const PING_MAX_OUTPUT_TOKENS = 16;

type ValidationError =
  | 'NO_KEY'
  | 'UNSUPPORTED_PROVIDER'
  | 'INVALID_ENDPOINT'
  | 'INVALID_KEY'
  | 'INVALID_MODEL'
  | 'RATE_LIMITED'
  | 'VALIDATION_FAILED'
  | 'NETWORK';

const NO_CAPABILITIES = { text: false, images: false, streaming: false };

function fail(error: ValidationError) {
  return NextResponse.json({ valid: false, capabilities: NO_CAPABILITIES, error });
}

export async function POST(request: NextRequest) {
  // SECURITY: this route dereferences a URL the caller names, and answers
  // whether that host responded. Unmetered, it is a request forwarder with a
  // reachability oracle attached, so it takes the same limit the generation
  // routes take.
  const { response: rateLimited } = handleRateLimiting(request);
  if (rateLimited) return rateLimited;

  const key = request.headers.get(PROVIDER_API_KEY_HEADER)?.trim();
  if (!key) {
    return fail('NO_KEY');
  }

  let body: { type?: string; model?: string; endpoint?: string } = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is fine — defaults apply.
  }

  const type = (body.type ?? 'gemini') as ProviderType;
  if (!getProviderAdapter(type)) {
    return fail('UNSUPPORTED_PROVIDER');
  }

  return type === 'gemini'
    ? validateGemini(key, body.model)
    : validateOpenAICompatible(key, type, body.endpoint, body.model);
}

/**
 * Gemini's ping, unchanged: its own REST shape on a pinned base URL, with the
 * safety settings the app actually sends so a key that works here works for
 * generation too.
 */
async function validateGemini(key: string, requestedModel?: string) {
  const model = requestedModel || DEFAULT_TEXT_MODEL;
  const endpoint = `${GEMINI_MODELS_BASE}/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await makeGeminiRequest(
      endpoint,
      key,
      {
        contents: [{ parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } },
        safetySettings: getSafetySettings(),
      },
      PING_TIMEOUT_MS
    );

    if (response.ok) {
      return NextResponse.json({
        valid: true,
        capabilities: toWireCapabilities('gemini'),
        model,
      });
    }

    return fail(classifyGeminiError(response.status, await readGeminiError(response)));
  } catch {
    return fail('NETWORK');
  }
}

/**
 * The OpenAI-compatible ping. The endpoint is a player-supplied URL that this
 * server dereferences, so it runs the same guard the generation path does — an
 * unreachable-by-policy endpoint is rejected here rather than at play time.
 */
async function validateOpenAICompatible(
  key: string,
  type: ProviderType,
  endpoint: string | undefined,
  requestedModel: string | undefined
) {
  if (!endpoint || !isSafeProviderEndpoint(endpoint)) {
    return fail('INVALID_ENDPOINT');
  }
  if (!requestedModel) {
    return fail('INVALID_MODEL');
  }

  try {
    const response = await sendProviderRequest(
      endpoint,
      { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      {
        model: requestedModel,
        messages: [{ role: 'user', content: 'ping' }],
        // Same name the generation path uses. Hardcoding max_tokens here made
        // the wizard refuse a key that generates fine, which is the third time
        // this ping has diverged from the real request and broken a provider.
        [presetMaxOutputTokensParamForEndpoint(endpoint) ?? 'max_tokens']: PING_MAX_OUTPUT_TOKENS,
      },
      {
        timeoutMs: PING_TIMEOUT_MS,
        playerSuppliedEndpoint: true,
        // A service that requires its declared headers has to get them in the
        // check that decides whether the key works, not only once play starts,
        // or the wizard rejects a key that would generate fine.
        customHeaders: presetHeadersForEndpoint(endpoint),
      }
    );

    if (response.ok) {
      return NextResponse.json({
        valid: true,
        capabilities: toWireCapabilities(type),
        model: requestedModel,
      });
    }

    return fail(classifyOpenAICompatibleError(response.status, await readErrorMessage(response)));
  } catch {
    return fail('NETWORK');
  }
}

/**
 * The three fields ProviderConfig stores. Every provider we can reach streams;
 * only Gemini generates images.
 */
function toWireCapabilities(type: ProviderType) {
  return {
    text: true,
    images: supportsImages(type),
    streaming: true,
  };
}

interface UpstreamError {
  status?: string;
  message: string;
}

/** Pull Google's { error: { status, message } } without ever logging it. */
async function readGeminiError(response: Response): Promise<UpstreamError> {
  try {
    const body = (await response.json()) as { error?: { status?: string; message?: string } };
    return { status: body.error?.status, message: (body.error?.message ?? '').toLowerCase() };
  } catch {
    return { message: '' };
  }
}

/** OpenAI-shaped errors are { error: { message, code } } — the message is enough. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return (body.error?.message ?? '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Map Google's response to a stable error code. A bad key comes back as HTTP 400
 * INVALID_ARGUMENT ("API key not valid"), not 401 — so we lean on the error body,
 * not just the status.
 */
function classifyGeminiError(httpStatus: number, upstream: UpstreamError): ValidationError {
  const { status, message } = upstream;

  if (httpStatus === 429 || status === 'RESOURCE_EXHAUSTED') return 'RATE_LIMITED';
  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    status === 'UNAUTHENTICATED' ||
    status === 'PERMISSION_DENIED' ||
    message.includes('api key')
  ) {
    return 'INVALID_KEY';
  }
  if (httpStatus === 404 || status === 'NOT_FOUND' || message.includes('not found') || message.includes('not supported')) {
    return 'INVALID_MODEL';
  }
  return 'VALIDATION_FAILED';
}

/**
 * The OpenAI-compatible equivalent. These providers do use 401/403 for a bad
 * key, but they disagree on what an unknown model is: OpenAI answers 404,
 * OpenRouter and Together answer 400 with the model named in the message.
 */
function classifyOpenAICompatibleError(httpStatus: number, message: string): ValidationError {
  if (httpStatus === 429) return 'RATE_LIMITED';
  if (httpStatus === 401 || httpStatus === 403 || message.includes('api key')) return 'INVALID_KEY';
  if (httpStatus === 404 || message.includes('model')) return 'INVALID_MODEL';
  return 'VALIDATION_FAILED';
}
