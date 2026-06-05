// src/app/api/ai/validate-provider/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { makeGeminiRequest } from '@/utils/apiHelpers';
import { getSafetySettings } from '@/lib/ai/config';
import { PROVIDER_API_KEY_HEADER } from '@/lib/ai/providerKeyHeader';

/**
 * Validates a provider configuration WITHOUT storing the key server-side.
 *
 * The candidate key arrives in the PROVIDER_API_KEY_HEADER (read directly, not
 * via the env fallback — we want to test exactly what the player typed). We make
 * one cheap text ping to Gemini and map the upstream status to a stable result.
 * The key is never logged, never persisted, and never echoed back.
 *
 * Only Gemini is wired end-to-end for this release; other provider types report
 * UNSUPPORTED_PROVIDER.
 */

const GEMINI_MODELS_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

type ValidationError =
  | 'NO_KEY'
  | 'UNSUPPORTED_PROVIDER'
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
  const key = request.headers.get(PROVIDER_API_KEY_HEADER)?.trim();
  if (!key) {
    return fail('NO_KEY');
  }

  let body: { type?: string; model?: string } = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is fine — defaults apply.
  }

  const type = body.type ?? 'gemini';
  if (type !== 'gemini') {
    return fail('UNSUPPORTED_PROVIDER');
  }

  const model = body.model || DEFAULT_MODEL;
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
      10000
    );

    if (response.ok) {
      return NextResponse.json({
        valid: true,
        capabilities: { text: true, images: true, streaming: true },
        model,
      });
    }

    if (response.status === 401 || response.status === 403) return fail('INVALID_KEY');
    if (response.status === 404) return fail('INVALID_MODEL');
    if (response.status === 429) return fail('RATE_LIMITED');
    return fail('VALIDATION_FAILED');
  } catch {
    return fail('NETWORK');
  }
}
