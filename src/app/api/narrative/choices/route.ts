// src/app/api/narrative/choices/route.ts

import { NextRequest } from 'next/server';
import { processAITextRequest, withAIRoute } from '@/utils/apiHelpers';

// Vercel function budget. Must be a static literal (Next.js segment config);
// sized as the single 30s Gemini attempt (GEMINI_ATTEMPT_TIMEOUT_MS in
// lib/constants/aiTimeouts) plus server-side overhead, so deploys don't ride
// a plan default shorter than the attempt itself.
export const maxDuration = 60;

export const POST = withAIRoute(async (request: NextRequest) => {
  return processAITextRequest(request, {
    maxTokens: 2048,
    temperature: 0.7,
    errorContext: 'Choice generation'
  });
});
