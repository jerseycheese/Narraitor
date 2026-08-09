// src/app/api/narrative/generate/route.ts

import { NextRequest } from 'next/server';
import { processGeminiStreamingTextRequest } from '../../../../utils/apiHelpers';

// Vercel function budget. Must be a static literal (Next.js segment config);
// sized as the single 30s Gemini attempt (GEMINI_ATTEMPT_TIMEOUT_MS in
// lib/constants/aiTimeouts) plus server-side overhead, so deploys don't ride
// a plan default shorter than the attempt itself.
export const maxDuration = 60;

// Streaming (issue #1476): the narrative panel is the most-repeated moment
// in the app, so this is the one Gemini text route worth the extra
// complexity of forwarding progressive content instead of the simpler
// single-JSON-response path the other narrative routes use.
export async function POST(request: NextRequest) {
  return processGeminiStreamingTextRequest(request, {
    // Matches lib/ai/config's default. A weighty beat asks for 3-4 paragraphs
    // plus its JSON metadata, which crowds a 1024 ceiling and gets truncated
    // mid-object — and a truncated response is unparseable, not just short.
    maxTokens: 2048,
    temperature: 0.7,
    errorContext: 'Narrative generation'
  });
}
