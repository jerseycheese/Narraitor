// src/lib/ai/resolveModel.ts

import type { NextRequest } from 'next/server';
import { PROVIDER_API_KEY_HEADER, PROVIDER_MODEL_HEADER } from './providerKeyHeader';
import { DEFAULT_TEXT_MODEL } from './config';

/**
 * SECURITY: the model name is interpolated into the Gemini REST URL, so an
 * arbitrary header value could steer a request at some other path. Only
 * Google's own model-id shape gets through; anything else is treated as absent.
 */
const MODEL_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.\-_]{0,63}$/;

/**
 * Resolve the model for a request, mirroring resolveApiKey.
 *
 * Priority: the model the player picked in their provider configuration (sent
 * per request in PROVIDER_MODEL_HEADER) -> the default text model. A player
 * with no provider configured, and every existing session, keeps running on the
 * default, so nothing changes underneath them.
 *
 * SECURITY: the model only counts when the caller supplied their own key in the
 * same request. A deployment with a server env key would otherwise let any
 * anonymous caller name an expensive model and spend that key on it, since
 * resolveApiKey falls back to the env key on its own.
 */
export function resolveModel(request?: NextRequest): string {
  const hasProviderKey = Boolean(request?.headers.get(PROVIDER_API_KEY_HEADER)?.trim());
  if (!hasProviderKey) return DEFAULT_TEXT_MODEL;

  const headerModel = request?.headers.get(PROVIDER_MODEL_HEADER)?.trim();
  if (headerModel && MODEL_ID_PATTERN.test(headerModel)) return headerModel;

  return DEFAULT_TEXT_MODEL;
}
