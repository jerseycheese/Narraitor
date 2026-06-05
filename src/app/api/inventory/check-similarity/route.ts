// src/app/api/inventory/check-similarity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { getDefaultConfig } from '@/lib/ai/config';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';
import Logger from '@/lib/utils/logger';

const logger = new Logger('CheckSimilarityAPI');

/**
 * API endpoint to check if two item names refer to the same item.
 * Uses AI to handle complex semantic similarity.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name1, name2 } = body;

    if (!name1 || !name2) {
      return NextResponse.json(
        { error: 'Both name1 and name2 are required' },
        { status: 400 }
      );
    }

    // Quick exact match check
    if (name1.trim().toLowerCase() === name2.trim().toLowerCase()) {
      return NextResponse.json({
        similar: true,
        confidence: 1.0,
        rationale: 'Exact match',
      });
    }

    const prompt = `Are these two item names referring to the same item? You must respond with ONLY a JSON object in this exact format:
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

Response (JSON only):`;

    const config = getDefaultConfig(resolveApiKey(request));
    const client = new GeminiClient(config);
    const response = await client.generateContent(prompt);

    // Parse JSON from response
    const text = response.content.trim();

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('No JSON found in AI response:', text);
      return NextResponse.json({
        similar: false,
        confidence: 0.0,
        rationale: 'Could not parse AI response',
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      similar: parsed.similar ?? false,
      confidence: parsed.confidence ?? 0.0,
      rationale: parsed.rationale,
    });

  } catch (error) {
    logger.error('Error checking item similarity:', error);

    return NextResponse.json(
      {
        error: 'Failed to check item similarity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
