import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
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

    // Generate a simple prompt for world image
    const world = body.world;
    const prompt = `Generate a high-quality landscape image for a fantasy RPG world called "${world.name}". 
    
World Description: ${world.description}
Theme: ${world.theme}

The image should show a beautiful, atmospheric landscape that captures the essence of this world. 
Make it suitable for a fantasy role-playing game. The image should be detailed, immersive, and evoke the mood described.

Style: Fantasy art, detailed landscape, atmospheric, game-ready`;

    // Use server-side AI client for image generation
    const client = createDefaultGeminiClient();
    
    try {
      // Try to generate image (note: Gemini may not support image generation in all configurations)
      const response = await client.generateContent(prompt);
      
      // For now, return a placeholder or description since we may not have image generation
      // In a real implementation, this would use an image generation service
      return NextResponse.json({ 
        imageUrl: null, // No actual image generated
        description: response.content,
        placeholder: true 
      });
    } catch (imageError) {
      console.log('Image generation not available, using placeholder:', imageError);
      
      // Return a placeholder response when image generation fails
      return NextResponse.json({ 
        imageUrl: null,
        description: `A beautiful ${world.theme} landscape representing ${world.name}: ${world.description}`,
        placeholder: true
      });
    }
  } catch (error) {
    console.error('World image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate world image. Please try again.' },
      { status: 500 }
    );
  }
}