// src/lib/ai/resolveApiKey.ts

import type { NextRequest } from 'next/server';
import {
  PROVIDER_API_KEY_HEADER,
  PROVIDER_ENDPOINT_HEADER,
  PROVIDER_MODEL_HEADER,
  PROVIDER_TYPE_HEADER,
} from './providerKeyHeader';
import { DEFAULT_TEXT_MODEL } from './config';
import { presetHeadersForEndpoint } from './presets';
import { isProviderSupported } from './providers/adapterRegistry';
import { isSafeProviderEndpoint } from './providers/endpointGuard';
import type { ProviderDescriptor } from './providers/types';
import type { ProviderType } from '@/types/provider.types';

/**
 * Turns a request into the provider it should be served by.
 *
 * This used to return a bare key, which is why `config.type`, `config.endpoint`
 * and `config.model` never reached the server and every request went to Gemini
 * regardless of what the player had configured. It now resolves the whole
 * descriptor — type, endpoint, model, key — and the routes pass that around.
 *
 * SECURITY: never log a descriptor or any of these header values.
 */

const PROVIDER_TYPES: ProviderType[] = ['gemini', 'openai-compatible', 'claude', 'ollama'];

/**
 * Gemini model ids are interpolated into a REST URL, so an arbitrary value
 * could steer a request at some other path. Only Google's own model-id shape
 * gets through.
 */
const GEMINI_MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.\-_]{0,63}$/;

/**
 * Other providers carry the model in the request body, not the URL, so the
 * vendor-prefixed ids they actually use (`meta-llama/Llama-3.3-70B-Instruct-Turbo`,
 * `google/gemini-2.5-flash:free`) are fine. Whitespace and control characters
 * are not, and the length is capped so a header can't carry a payload.
 */
const BODY_MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.\-_/:]{0,127}$/;

export type ProviderResolutionFailure =
  | 'NO_KEY'
  | 'UNSUPPORTED_PROVIDER'
  | 'INVALID_ENDPOINT'
  | 'INVALID_MODEL';

export type ProviderResolution =
  | { ok: true; descriptor: ProviderDescriptor }
  | { ok: false; reason: ProviderResolutionFailure };

/**
 * Resolve the provider for a request.
 *
 * Priority for the key: the player's bring-your-own key (sent per request in
 * PROVIDER_API_KEY_HEADER) -> the server env key as a dev/local fallback. With
 * neither, this fails with NO_KEY, which reproduces today's "API key not
 * configured" behaviour exactly.
 *
 * SECURITY: type, endpoint and model are honoured only when the caller supplied
 * their own key in the same request. A deployment with a server env key would
 * otherwise let any anonymous caller name an endpoint and have the server post
 * that env key to it — key exfiltration, not just cost. On the env-key path the
 * provider is always Gemini with the default model.
 *
 * The MOCK_API_KEY sentinel only gates the env branch — a real player would
 * never type it. NextRequest is a type-only import, so this module stays safe
 * to pull into the client bundle.
 */
export function resolveProvider(request?: NextRequest): ProviderResolution {
  const headerKey = request?.headers.get(PROVIDER_API_KEY_HEADER)?.trim();

  if (!headerKey) {
    const envKey = process.env.GEMINI_API_KEY;
    if (!envKey || envKey === 'MOCK_API_KEY') return { ok: false, reason: 'NO_KEY' };

    return {
      ok: true,
      descriptor: {
        type: 'gemini',
        endpoint: '',
        model: DEFAULT_TEXT_MODEL,
        apiKey: envKey,
      },
    };
  }

  const type = readProviderType(request);
  if (!type) return { ok: false, reason: 'UNSUPPORTED_PROVIDER' };

  const model = readModel(request, type);
  if (!model) return { ok: false, reason: 'INVALID_MODEL' };

  const endpoint = readEndpoint(request, type);
  if (endpoint === null) return { ok: false, reason: 'INVALID_ENDPOINT' };

  return {
    ok: true,
    descriptor: {
      type,
      endpoint,
      model,
      apiKey: headerKey,
      customHeaders: presetHeadersForEndpoint(endpoint),
    },
  };
}

/**
 * The effective key for the Gemini-native paths — image generation and the
 * routes that still construct a Gemini client directly.
 *
 * Returns null when the active provider is not Gemini, rather than handing a
 * player's OpenRouter key to Google. Those callers are Gemini-only by design —
 * image generation stays on Gemini — so "no key" is the honest answer.
 *
 * The null is load-bearing downstream: it means "this request resolved no
 * Gemini key", which resolveEffectiveGeminiKey refuses to paper over with the
 * server's own key. See lib/ai/config.
 */
export function resolveApiKey(request?: NextRequest): string | null {
  const resolution = resolveProvider(request);
  if (!resolution.ok) return null;
  return resolution.descriptor.type === 'gemini' ? resolution.descriptor.apiKey : null;
}

/**
 * The descriptor for a request, or null when nothing usable resolves.
 *
 * The form the generators take (see ProviderCredential): a route calls this and
 * forwards the result, and every generator downstream builds a client for
 * whichever provider the player configured without any of them naming one.
 */
export function resolveProviderCredential(request?: NextRequest): ProviderDescriptor | null {
  const resolution = resolveProvider(request);
  return resolution.ok ? resolution.descriptor : null;
}

/** An absent type header means Gemini — that is what every session before multi-provider sent. */
function readProviderType(request?: NextRequest): ProviderType | null {
  const raw = request?.headers.get(PROVIDER_TYPE_HEADER)?.trim().toLowerCase();
  if (!raw) return 'gemini';

  const type = PROVIDER_TYPES.find((candidate) => candidate === raw);
  if (!type || !isProviderSupported(type)) return null;
  return type;
}

/**
 * The player's model, or the default. Gemini falls back to DEFAULT_TEXT_MODEL
 * when the header is absent or malformed; other providers have no meaningful
 * default, so a missing model there is a resolution failure rather than a
 * silent substitution of someone else's model id.
 */
function readModel(request: NextRequest | undefined, type: ProviderType): string | null {
  const raw = request?.headers.get(PROVIDER_MODEL_HEADER)?.trim();

  if (type === 'gemini') {
    return raw && GEMINI_MODEL_PATTERN.test(raw) ? raw : DEFAULT_TEXT_MODEL;
  }

  return raw && BODY_MODEL_PATTERN.test(raw) ? raw : null;
}

/**
 * The upstream URL. Gemini's is pinned in its adapter and never comes from a
 * header, so this returns an empty string for it. Everything else must supply
 * one that survives the endpoint guard; null signals a failed resolution.
 */
function readEndpoint(request: NextRequest | undefined, type: ProviderType): string | null {
  if (type === 'gemini') return '';

  const raw = request?.headers.get(PROVIDER_ENDPOINT_HEADER)?.trim();
  if (!raw || !isSafeProviderEndpoint(raw)) return null;
  return raw;
}
