import { NextRequest, NextResponse } from 'next/server';
import { generateAICharacter } from '@/lib/generators/characterGenerator';
import type { World } from '@/types/world.types';

interface GenerateCharacterRequest {
  worldId: string;
  characterType: 'known' | 'original' | 'specific';
  existingNames?: string[];
  suggestedName?: string;
  world: World;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateCharacterRequest;
    
    if (!body.worldId || !body.characterType) {
      return NextResponse.json(
        { error: 'World ID and character type are required' },
        { status: 400 }
      );
    }

    // Get the world data from the request body
    // Note: In a real app, you'd get this from a database
    // For now, we receive the world data from the client
    const { world } = body;
    
    if (!world) {
      return NextResponse.json(
        { error: 'World data is required' },
        { status: 400 }
      );
    }

    const generatedData = await generateAICharacter(
      world,
      body.existingNames || [],
      body.suggestedName,
      body.characterType
    );

    return NextResponse.json(generatedData);
  } catch (error) {
    console.error('Character generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate character. Please try again.' },
      { status: 500 }
    );
  }
}