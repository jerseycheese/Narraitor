import { NextRequest, NextResponse } from 'next/server';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';
import { createAIClient } from '@/lib/ai/clientFactory';
import type { World } from '@/types/world.types';

interface GenerateWorldImageRequest {
  world: World;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateWorldImageRequest;
    
    if (!body.world) {
      return NextResponse.json(
        { error: 'World data is required' },
        { status: 400 }
      );
    }

    const aiClient = createAIClient();
    const imageGenerator = new WorldImageGenerator(aiClient);
    const worldImage = await imageGenerator.generateWorldImage(body.world);

    return NextResponse.json({ imageUrl: worldImage.url });
  } catch (error) {
    console.error('World image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate world image. Please try again.' },
      { status: 500 }
    );
  }
}