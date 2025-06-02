import { NextRequest, NextResponse } from 'next/server';
import { generateWorld } from '@/lib/generators/worldGenerator';
import Logger from '@/lib/utils/logger';

const logger = new Logger('API');

interface GenerateWorldRequest {
  worldReference?: string;
  worldRelationship?: 'based_on' | 'set_in';
  suggestedName?: string;
  existingNames?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateWorldRequest;
    
    if (body.worldRelationship && !body.worldReference?.trim()) {
      return NextResponse.json(
        { error: 'Setting or time period is required when relationship is selected' },
        { status: 400 }
      );
    }

    logger.debug('generate-world API', 'Generating world for reference:', body.worldReference);

    // Generate the world using the generator
    const generatedWorld = await generateWorld({
      method: 'ai',
      reference: body.worldReference,
      relationship: body.worldRelationship || 'based_on',
      existingNames: body.existingNames,
      suggestedName: body.suggestedName
    });
    
    logger.debug('generate-world API', 'World generated:', generatedWorld.name);

    return NextResponse.json(generatedWorld);

  } catch (error) {
    logger.error('generate-world API', 'World generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate world',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}