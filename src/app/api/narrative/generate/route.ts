// src/app/api/narrative/generate/route.ts

import { NextRequest } from 'next/server';
import { processGeminiTextRequest } from '../../../../utils/apiHelpers';

export async function POST(request: NextRequest) {
  return processGeminiTextRequest(request, {
    maxTokens: 1024,
    temperature: 0.7,
    errorContext: 'Narrative generation'
  });
}
