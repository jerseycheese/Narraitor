// src/app/api/inventory/check-similarity/route.ts

import { NextRequest } from 'next/server';
import Logger from '@/lib/utils/logger';
import { handleSimilarityCheck } from '@/app/api/_shared/similarityCheck';
import { withAIRoute } from '@/utils/apiHelpers';

const logger = new Logger('CheckSimilarityAPI');

/**
 * API endpoint to check if two item names refer to the same item.
 * Uses AI to handle complex semantic similarity.
 */
export const POST = withAIRoute(async (request: NextRequest) => {
  return handleSimilarityCheck(request, {
    logger,
    route: '/api/inventory/check-similarity',
    errorLogMessage: 'Error checking item similarity:',
    failureMessage: 'Failed to check item similarity',
    buildPrompt: ({ name1, name2 }) => `Are these two item names referring to the same item? You must respond with ONLY a JSON object in this exact format:
{
  "similar": true or false,
  "confidence": 0.0 to 1.0,
  "rationale": "brief explanation"
}

Item 1: "${name1}"
Item 2: "${name2}"

Consider:
- Synonyms (mom/mother, dad/father, sword/blade, etc.)
- Singular/plural (coin/coins, potion/potions)
- Word order (Photo of Mom vs Mom's Photo)
- Descriptive modifiers (Rusty Iron Sword vs Iron Sword)
- Possessives (your mother vs mother)

If they clearly refer to the same item, return similar: true with high confidence.
If they're definitely different items, return similar: false.

Response (JSON only):`,
  });
});
