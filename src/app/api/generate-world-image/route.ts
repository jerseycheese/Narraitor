import { NextRequest, NextResponse } from 'next/server';
import type { World } from '@/types/world.types';

interface GenerateWorldImageRequest {
  world: World;
}

// Generate themed placeholder images based on world characteristics
function generatePlaceholderImage(world: World): string {
  const theme = world.theme?.toLowerCase() || 'fantasy';
  
  // Different image dimensions/filters based on theme
  switch(theme) {
    case 'fantasy':
      return `https://picsum.photos/seed/${world.name}/800/600?blur=1`;
    case 'sci-fi':
    case 'science fiction':
      return `https://picsum.photos/seed/${world.name}/800/600?grayscale`;
    case 'horror':
      return `https://picsum.photos/seed/${world.name}/800/600?blur=2`;
    case 'western':
      return `https://picsum.photos/seed/${world.name}/800/600?sepia`;
    case 'cyberpunk':
      return `https://picsum.photos/seed/${world.name}/800/600`;
    case 'post-apocalyptic':
      return `https://picsum.photos/seed/${world.name}/800/600?grayscale&blur=1`;
    default:
      return `https://picsum.photos/seed/${world.name}/800/600`;
  }
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

    // For now, generate themed placeholder images based on world type
    // In production, this would integrate with DALL-E, Midjourney, or similar service
    const imageUrl = generatePlaceholderImage(body.world);
    
    return NextResponse.json({ 
      imageUrl,
      description: `A ${body.world.theme} landscape representing ${body.world.name}: ${body.world.description}`,
      placeholder: false
    });
  } catch (error) {
    console.error('World image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate world image. Please try again.' },
      { status: 500 }
    );
  }
}