import { NextRequest, NextResponse } from 'next/server';
import { generateWorld } from '@/lib/ai/worldGenerator';

interface GenerateWorldRequest {
  worldReference: string;
  existingNames: string[];
  suggestedName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateWorldRequest;
    
    if (!body.worldReference?.trim()) {
      return NextResponse.json(
        { error: 'World reference is required' },
        { status: 400 }
      );
    }

    const generatedData = await generateWorld(
      body.worldReference,
      body.existingNames || [],
      body.suggestedName
    );

    return NextResponse.json(generatedData);
  } catch (error) {
    console.error('World generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate world configuration. Please try again.' },
      { status: 500 }
    );
  }
}