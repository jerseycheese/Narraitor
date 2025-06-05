// src/app/api/narrative/ending/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { endingGenerator } from '../../../../lib/ai/endingGenerator';
import { logger } from '../../../../lib/utils/logger';
import type { EndingGenerationRequest } from '../../../../types/narrative.types';

export async function POST(request: NextRequest) {
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

    // Validate ending type
    const validEndingTypes = ['player-choice', 'story-complete', 'session-limit', 'character-retirement'];
    if (!validEndingTypes.includes(endingType)) {
      return NextResponse.json(
        { error: `Invalid ending type. Must be one of: ${validEndingTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the ending generation request
    const endingRequest: EndingGenerationRequest = {
      sessionId,
      characterId,
      worldId,
      endingType,
      desiredTone: body.desiredTone,
      customPrompt: body.customPrompt
    };

    logger.info('Generating story ending', { 
      sessionId, 
      characterId, 
      worldId, 
      endingType,
      hasCustomPrompt: !!body.customPrompt 
    });

    // Generate the ending
    const result = await endingGenerator.generateEnding(endingRequest);

    logger.info('Story ending generated successfully', { 
      sessionId,
      tone: result.tone,
      achievementCount: result.achievements.length,
      playTime: result.playTime,
      tokenUsage: result.tokenUsage
    });

    // Return the generated ending
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to generate story ending', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Resource not found', details: error.message },
          { status: 404 }
        );
      }
      
      if (error.message.includes('API') || error.message.includes('generation')) {
        return NextResponse.json(
          { error: 'AI service unavailable', details: 'Please try again later' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: 'Failed to generate ending' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Use POST to generate a story ending'
    },
    { status: 405 }
  );
}