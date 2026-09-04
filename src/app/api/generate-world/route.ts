import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderCredential } from '@/lib/ai/resolveApiKey';
import { createAPIErrorResponse } from '@/lib/utils/createAPIErrorResponse';
import { generateWorld } from '@/lib/generators/worldGenerator';
import { withAIRoute } from '@/utils/apiHelpers';
import Logger from '@/lib/utils/logger';

const logger = new Logger('API');

interface GenerateWorldRequest {
  worldReference?: string;
  worldRelationship?: 'inspired_by' | 'set_within';
  suggestedName?: string;
  existingNames?: string[];
}

export const POST = withAIRoute(async (request: NextRequest) => {
  try {
    logger.debug('generate-world API', 'Request received');
    const body = await request.json() as GenerateWorldRequest;
    logger.debug('generate-world API', 'Request body parsed:', JSON.stringify(body));
    
    if (body.worldRelationship && !body.worldReference?.trim()) {
      logger.debug('generate-world API', 'Validation failed: relationship without reference');
      return NextResponse.json(
        { error: 'Existing setting is required when world type is selected' },
        { status: 400 }
      );
    }

    logger.debug('generate-world API', 'Generating world for reference:', body.worldReference);

    // Generate the world using the generator
    const generatedWorld = await generateWorld({
      method: 'ai',
      reference: body.worldReference,
      relationship: body.worldRelationship || 'inspired_by',
      existingNames: body.existingNames,
      suggestedName: body.suggestedName
    }, resolveProviderCredential(request));
    
    // Validate generated world structure
    if (!generatedWorld.name || !generatedWorld.description || !generatedWorld.genre) {
      logger.error('generate-world API', 'Generated world missing required fields:', generatedWorld);
      return NextResponse.json(
        { error: 'Generated world data is incomplete' },
        { status: 500 }
      );
    }
    
    logger.debug('generate-world API', 'World generated:', generatedWorld.name);

    return NextResponse.json(generatedWorld);

  } catch (error) {
    logger.error('generate-world API', 'World generation failed:', error);

    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Failed to generate world'),
      500
    );
  }
});
