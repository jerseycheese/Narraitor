import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderCredential } from '@/lib/ai/resolveApiKey';
import { createAPIErrorResponse } from '@/lib/utils/createAPIErrorResponse';
import { generateAICharacter } from '@/lib/generators/characterGenerator';
import { World } from '@/types/world.types';
import { validateWorld } from '@/lib/utils/typeGuards';
import { withAIRoute } from '@/utils/apiHelpers';

import Logger from '@/lib/utils/logger';
const logger = new Logger('GenerateCharacter');

export const POST = withAIRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const characterType = body?.characterType;
    const existingNames = body?.existingNames;
    const suggestedName = body?.suggestedName;
    const concept = body?.concept;
    const worldData = body?.world;
    
    if (!worldData) {
      return createAPIErrorResponse(
        new Error('400 bad request: world data is required'),
        400
      );
    }

    // Validate world data structure
    const worldValidation = validateWorld(worldData);
    if (!worldValidation.valid) {
      return createAPIErrorResponse(
        new Error(`400 bad request: invalid world data - ${worldValidation.errors[0]}`),
        400,
        worldValidation.errors[0]
      );
    }
    
    const world = worldData as World;

    // Generate character using the existing function
    const generatedCharacter = await generateAICharacter(
      world,
      (Array.isArray(existingNames) ? existingNames : []) as string[],
      suggestedName as string | undefined,
      (characterType as 'original' | 'known' | 'specific') || 'original',
      typeof concept === 'string' ? concept : undefined,
      resolveProviderCredential(request)
    );

    return NextResponse.json(generatedCharacter);
  } catch (error) {
    logger.error('Character generation error:', error);

    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Character generation failed'),
      500
    );
  }
});
