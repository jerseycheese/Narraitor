/**
 * API endpoint for AI-powered lore similarity checking
 * Mirrors the pattern from inventory similarity checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { getDefaultConfig } from '@/lib/ai/config';
import Logger from '@/lib/utils/logger';

const logger = new Logger('CheckLoreSimilarityAPI');

/**
 * Check if two lore entity names refer to the same entity
 * Uses AI to handle complex semantic similarity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name1, name2, category } = body;

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

    const categoryContext = category === 'characters'
      ? 'character names'
      : category === 'locations'
      ? 'location names'
      : 'entity names';

    const prompt = `Are these two${categoryContext}referring to the same entity? You must respond with ONLY a JSON object in this exact format: { "similar": true or false, "confidence": 0.0 to 1.0, "rationale": "brief explanation" } Name 1: "${name1}" Name 2: "${name2}" Consider: - Spelling variations (Gandalf/Gandolf, Seraphina/Serafina) - Title differences (Lady Seraphina vs Seraphina, Sir John vs John) - Word order (John the Smith vs Smith, John) - Nicknames and shortened forms (Elizabeth vs Liz, Jonathan vs Jon) - Special characters and punctuation ("Sir John's Tavern" vs "Sir Johns Tavern") - Common fantasy name variations If they clearly refer to the same entity, return similar: true with high confidence. If they're definitely different entities, return similar: false. For uncertain cases, adjust confidence accordingly. Response (JSON only):`;

    const config = getDefaultConfig();
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
    logger.error('Error checking lore similarity:', error);

    return NextResponse.json(
      {
        error: 'Failed to check lore similarity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
