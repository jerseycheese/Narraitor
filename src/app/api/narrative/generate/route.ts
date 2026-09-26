// src/app/api/narrative/generate/route.ts

import { NextRequest } from 'next/server';
import { processAIStreamingTextRequest, withAIRoute } from '@/utils/apiHelpers';

// Vercel function budget. Must be a static literal (Next.js segment config);
// sized as the single 30s Gemini attempt (GEMINI_ATTEMPT_TIMEOUT_MS in
// lib/constants/aiTimeouts) plus server-side overhead, so deploys don't ride
// a plan default shorter than the attempt itself.
export const maxDuration = 60;

// Streaming (issue #1476): the narrative panel is the most-repeated moment
// in the app, so this is the one Gemini text route worth the extra
// complexity of forwarding progressive content instead of the simpler
// single-JSON-response path the other narrative routes use.
export const POST = withAIRoute(async (request: NextRequest) => {
  return processAIStreamingTextRequest(request, {
    // Default when caller specifies no maxTokens (matches lib/ai/config).
    // Sized for standard narrative prose beats (3-4 paragraphs plus JSON metadata).
    // Callers with heavier budgets (e.g. goal extraction) can request up to
    // SERVER_MAX_OUTPUT_TOKENS (4096).
    maxTokens: 2048,
    temperature: 0.7,
    errorContext: 'Narrative generation'
  });
});
