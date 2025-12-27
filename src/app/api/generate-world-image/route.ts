import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import type { World } from '@/types/world.types';
import Logger from '@/lib/utils/logger';
import { generateAndSaveImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import { getGenreStyleGuidance, getGenreFallbackImage } from '@/lib/utils/genrePromptGuide';

const logger = new Logger('WorldImageAPI');

interface GenerateWorldImageRequest {
  world: World;
  customPrompt?: string;
}

// Generate a detailed image prompt based on world characteristics
function generateImagePrompt(world: World): string {
  const genre = world.genre || 'fantasy';
  const name = world.name;
  const description = world.description;

  // Create a detailed prompt for image generation
  const basePrompt = `Create a highly detailed, cinematic landscape image representing the world "${name}". Genre: ${genre}. Description: ${description}`;

  // Get genre-specific style guidance from shared utility
  const styleGuidance = getGenreStyleGuidance(genre, 'landscape');

  return `${basePrompt}

${styleGuidance}

Requirements:
- Ultra-high quality, 4K resolution concept art
- Cinematic composition with dramatic lighting
- Rich detail and atmospheric depth
- Professional game/film concept art style
- Landscape orientation (16:9 or similar)
- No text, logos, or watermarks
- Vivid but realistic colors appropriate to the theme`;
}

// Generate fallback placeholder if AI generation fails
function generateFallbackImage(world: World): string {
  const genre = world.genre || 'fantasy';
  return getGenreFallbackImage(genre, world.name);
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

    logger.debug('generate-world-image', 'Starting image generation for world:', body.world.name);

    try {
      // Use custom prompt if provided, otherwise generate one using AI
      const client = createDefaultGeminiClient();
      let imagePrompt: string;
      
      if (body.customPrompt) {
        // Use the custom prompt directly
        imagePrompt = body.customPrompt;
        logger.debug('generate-world-image', 'Using custom prompt:', imagePrompt);
      } else {
        // Generate image prompt using AI
        imagePrompt = generateImagePrompt(body.world);
        logger.debug('generate-world-image', 'Generated image prompt:', imagePrompt);
      }

      // Generate a detailed description that could be used with real AI image generation
      let imageDescription: string;
      
      if (body.customPrompt) {
        // Use the custom prompt as the image description directly
        imageDescription = body.customPrompt;
        logger.debug('generate-world-image', 'Using custom prompt as image description:', imageDescription);
      } else {
        // Generate a detailed description using AI
        const promptResponse = await client.generateContent(`
          Generate a detailed, artistic description for an image of this world that could be used as a prompt for an AI image generator like DALL-E or Midjourney. Be very specific about visual elements, atmosphere, lighting, and composition.
          
          ${imagePrompt}
          
          Respond with only the detailed visual description, no other text.
        `);
        imageDescription = promptResponse.content;
        logger.debug('generate-world-image', 'Generated image description:', imageDescription);
      }

      // Try to generate real AI image using Gemini's image generation model
      let imageUrl = '';
      let aiGenerated = false;
      let placeholder = true;

      // Check if we have Gemini API key for image generation
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== 'MOCK_API_KEY') {
        try {
          logger.debug('generate-world-image', 'Attempting Gemini image generation with model: gemini-2.5-flash-image');

          // Use the same approach as the portrait generation API
          const imagePromptForGemini = `Create a detailed landscape image representing the world "${body.world.name}". ${imageDescription}

Requirements:
- Epic cinematic landscape
- High quality digital art style
- Professional game concept art
- Rich atmospheric lighting and details
- ${body.world.genre} genre elements
- No text, logos, or watermarks
- Landscape orientation suitable for world imagery`;

          // Generate and save the image to the file system
          const savedImage = await generateAndSaveImageWithGemini(
            imagePromptForGemini,
            apiKey,
            body.world.id,
            'worlds'
          );

          if (savedImage) {
            imageUrl = savedImage.url;
            aiGenerated = true;
            placeholder = false;

            logger.debug('generate-world-image', `Gemini image saved successfully: ${savedImage.url} (${savedImage.fileSize} bytes)`);
          } else {
            logger.warn('generate-world-image', 'Image generation failed, using fallback');
            imageUrl = generateFallbackImage(body.world);
          }

        } catch (imageGenError) {
          logger.error('generate-world-image', 'Gemini image generation failed, using fallback:', imageGenError);
          imageUrl = generateFallbackImage(body.world);
        }
      } else {
        logger.debug('generate-world-image', 'No Gemini API key configured, using fallback');
        imageUrl = generateFallbackImage(body.world);
      }
      
      return NextResponse.json({ 
        imageUrl,
        description: imageDescription,
        prompt: imagePrompt,
        placeholder,
        aiGenerated,
        // Include the prompt for future use
        imageGenerationPrompt: imageDescription,
        // Include service info for debugging
        service: aiGenerated ? 'gemini-image-generation' : 'fallback'
      });

    } catch (aiError) {
      logger.error('generate-world-image', 'AI image prompt generation failed:', aiError);
      
      // Fallback to simple placeholder
      const fallbackUrl = generateFallbackImage(body.world);
      
      return NextResponse.json({ 
        imageUrl: fallbackUrl,
        description: `A ${body.world.genre} landscape representing ${body.world.name}: ${body.world.description}`,
        placeholder: true,
        aiGenerated: false
      });
    }

  } catch (error) {
    logger.error('generate-world-image', 'World image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate world image. Please try again.' },
      { status: 500 }
    );
  }
}
