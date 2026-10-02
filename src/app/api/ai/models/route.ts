// src/app/api/ai/models/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withAIRoute } from '@/utils/apiHelpers';
import { PROVIDER_API_KEY_HEADER } from '@/lib/ai/providerKeyHeader';
import { discoverModels } from '@/lib/ai/modelDiscovery';
import type { ProviderType } from '@/types/provider.types';

export const maxDuration = 60;

export const POST = withAIRoute(async (request: NextRequest) => {
  const key = request.headers.get(PROVIDER_API_KEY_HEADER)?.trim();

  let body: { type?: unknown; endpoint?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // An empty body will be validated below.
  }

  if (body.type !== undefined && typeof body.type !== 'string') {
    return NextResponse.json({ models: [], error: 'UNSUPPORTED_PROVIDER' });
  }

  const type = (body.type ?? 'gemini') as ProviderType;
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : undefined;

  const result = await discoverModels({
    type,
    endpoint,
    key,
    signal: request.signal,
  });

  return NextResponse.json(result);
});
