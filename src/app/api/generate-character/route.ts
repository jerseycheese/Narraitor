import { NextRequest, NextResponse } from 'next/server';
import { generateCharacter } from '@/lib/ai/characterGenerator';
import { getNestedValue } from '@/lib/utils';
import { World } from '@/types/world.types';
import { validateWorld } from '@/types/type-guards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterType = getNestedValue(body, 'characterType');
    const existingNames = getNestedValue(body, 'existingNames');
    const suggestedName = getNestedValue(body, 'suggestedName');
    const worldData = getNestedValue(body, 'world');
    
    if (!worldData) {
      return NextResponse.json(
        { error: 'World data is required' },
        { status: 400 }
      );
    }

    // Validate world data structure
    const worldValidation = validateWorld(worldData);
    if (!worldValidation.valid) {
      return NextResponse.json(
        { error: `Invalid world data: ${worldValidation.errors[0]}` },
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Character generation failed' },
      { status: 500 }
    );
  }
}
