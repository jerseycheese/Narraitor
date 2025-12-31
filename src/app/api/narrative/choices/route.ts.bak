// src/app/api/narrative/choices/route.ts

import { NextRequest } from 'next/server';
import { processGeminiTextRequest } from '../../../../utils/apiHelpers';

export async function POST(request: NextRequest) {
  return processGeminiTextRequest(request, {
    maxTokens: 2048,
    temperature: 0.7,
    errorContext: 'Choice generation'
  });
}
