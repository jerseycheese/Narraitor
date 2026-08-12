// src/lib/ai/resolveModel.ts

import type { NextRequest } from 'next/server';
import { PROVIDER_MODEL_HEADER } from './providerKeyHeader';
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
 */
export function resolveModel(request?: NextRequest): string {
  const headerModel = request?.headers.get(PROVIDER_MODEL_HEADER)?.trim();
  if (headerModel && MODEL_ID_PATTERN.test(headerModel)) return headerModel;

  return DEFAULT_TEXT_MODEL;
}
