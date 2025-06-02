import { NextRequest, NextResponse } from 'next/server';
import { generateCharacter } from '@/lib/ai/characterGenerator';
import { getDefaultConfig } from '@/lib/ai/config';
import { GeminiClient } from '@/lib/ai/geminiClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { worldId, characterType, existingNames, suggestedName, world } = body;

    if (!world) {
      return NextResponse.json(
        { error: 'World data is required' },
        { status: 400 }
      );
    }

    // Use the AI character generator with proper server-side client
    const config = getDefaultConfig();
    const client = new GeminiClient(config);
    
    // Generate character using the existing function
    const generatedCharacter = await generateCharacter(
      world,
      existingNames || [],
      suggestedName,
      characterType || 'original'
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