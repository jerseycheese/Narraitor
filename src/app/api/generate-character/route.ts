import { NextRequest, NextResponse } from 'next/server';
import { getUserFriendlyError } from '@/lib/utils/errorUtils';
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
      const validationError = getUserFriendlyError(new Error('400 bad request: world data is required'));
      return NextResponse.json(
        { 
          error: validationError.message,
          title: validationError.title,
          type: validationError.type,
          retryable: validationError.retryable
        },
        { status: 400 }
      );
    }

    // Validate world data structure
    const worldValidation = validateWorld(worldData);
    if (!worldValidation.valid) {
      const validationError = getUserFriendlyError(new Error(`400 bad request: invalid world data - ${worldValidation.errors[0]}`));
      return NextResponse.json(
        { 
          error: validationError.message,
          title: validationError.title,
          type: validationError.type,
          retryable: validationError.retryable,
          details: worldValidation.errors[0]
        },
        { status: 400 }
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
    
    const friendlyError = getUserFriendlyError(error instanceof Error ? error : new Error('Character generation failed'));
    return NextResponse.json(
      { 
        error: friendlyError.message,
        title: friendlyError.title,
        type: friendlyError.type,
        retryable: friendlyError.retryable,
        details: error instanceof Error ? error.message : 'Character generation failed'
      },
      { status: 500 }
    );
  }
}
