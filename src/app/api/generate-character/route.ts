import { NextRequest, NextResponse } from 'next/server';
import { createAPIErrorResponse, getErrorMessage } from '@/lib/utils/errorUtils';
import { generateCharacter } from '@/lib/ai/characterGenerator';
import { World } from '@/types/world.types';
import { validateWorld } from '@/types/type-guards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterType = body?.characterType;
    const existingNames = body?.existingNames;
    const suggestedName = body?.suggestedName;
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
    const generatedCharacter = await generateCharacter(
      world,
      (Array.isArray(existingNames) ? existingNames : []) as string[],
      suggestedName as string | undefined,
      (characterType as 'original' | 'known' | 'specific') || 'original'
    );

    return NextResponse.json(generatedCharacter);
  } catch (error) {
    console.error('Character generation error:', error);

    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Character generation failed'),
      500,
      getErrorMessage(error)
    );
  }
}
