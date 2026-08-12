// src/app/api/ai/validate-provider/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { makeGeminiRequest } from '@/utils/apiHelpers';
import { DEFAULT_TEXT_MODEL, getSafetySettings } from '@/lib/ai/config';
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

// Vercel function budget: one single-attempt Gemini ping (30s) + overhead.
export const maxDuration = 60;

const GEMINI_MODELS_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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

  const model = body.model || DEFAULT_TEXT_MODEL;
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

    return fail(classifyUpstreamError(response.status, await readUpstreamError(response)));
  } catch {
    return fail('NETWORK');
  }
}

interface UpstreamError {
  status?: string;
  message: string;
}

/** Pull Google's { error: { status, message } } without ever logging it. */
async function readUpstreamError(response: Response): Promise<UpstreamError> {
  try {
    const body = (await response.json()) as { error?: { status?: string; message?: string } };
    return { status: body.error?.status, message: (body.error?.message ?? '').toLowerCase() };
  } catch {
    return { message: '' };
  }
}

/**
 * Map Google's response to a stable error code. A bad key comes back as HTTP 400
 * INVALID_ARGUMENT ("API key not valid"), not 401 — so we lean on the error body,
 * not just the status.
 */
function classifyUpstreamError(httpStatus: number, upstream: UpstreamError): ValidationError {
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
