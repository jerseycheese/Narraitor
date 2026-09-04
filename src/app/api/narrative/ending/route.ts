// src/app/api/narrative/ending/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderCredential } from '@/lib/ai/resolveApiKey';
import { generateEnding } from '@/lib/ai/endingGenerator';
import { logger } from '@/lib/utils/logger';
import type { EndingGenerationRequest, EndingType, EndingTone } from '@/types/narrative.types';
import { reportServerError } from '@/lib/telemetry/reportServerError';
import { withAIRoute } from '@/utils/apiHelpers';

export const POST = withAIRoute(async (request: NextRequest) => {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { sessionId, characterId, worldId, endingType } = body;
    
    if (!sessionId || !characterId || !worldId || !endingType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, characterId, worldId, endingType' },
        { status: 400 }
      );
    }

    // Validate ending type using type-safe constants
    const validEndingTypes: EndingType[] = ['player-choice', 'story-complete', 'session-limit', 'character-retirement'];
    if (!validEndingTypes.includes(endingType as EndingType)) {
      return NextResponse.json(
        { error: `Invalid ending type. Must be one of: ${validEndingTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate desiredTone if provided using type-safe constants
    if (body.desiredTone) {
      const validTones: EndingTone[] = ['triumphant', 'mysterious', 'tragic', 'hopeful'];
      if (!validTones.includes(body.desiredTone as EndingTone)) {
        return NextResponse.json(
          { error: `Invalid tone. Must be one of: ${validTones.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const endingRequest: EndingGenerationRequest = {
      sessionId,
      characterId,
      worldId,
      endingType,
      desiredTone: body.desiredTone,
      customPrompt: body.customPrompt,
      world: body.world, // Pass world data from client
      character: body.character, // Pass character data from client
      narrativeSegments: body.narrativeSegments, // Pass narrative segments from client
      journalEntries: body.journalEntries, // Pass journal entries from client
      worldClock: body.worldClock,
    };

    logger.info('Generating story ending', { 
      sessionId, 
      characterId, 
      worldId, 
      endingType,
      hasCustomPrompt: !!body.customPrompt 
    });

    // Generate the ending
    const result = await generateEnding(endingRequest, resolveProviderCredential(request));

    logger.info('Story ending generated successfully', { 
      sessionId,
      tone: result.tone,
      achievementCount: result.achievements.length,
      playTime: result.playTime,
      tokenUsage: result.tokenUsage
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to generate story ending', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    reportServerError(error, { source: 'route', route: '/api/narrative/ending' });

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('API') || error.message.includes('generation')) {
        return NextResponse.json(
          { error: 'Model provider unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to generate a story ending'
    },
    { status: 405 }
  );
}
