import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import type { World } from '@/types/world.types';
import Logger from '@/lib/utils/logger';

const logger = new Logger('WorldImageAPI');

interface GenerateWorldImageRequest {
  world: World;
}

// Generate a detailed image prompt based on world characteristics
function generateImagePrompt(world: World): string {
  const theme = world.theme?.toLowerCase() || 'fantasy';
  const name = world.name;
  const description = world.description;
  
  // Create a detailed prompt for image generation
  const basePrompt = `Create a highly detailed, cinematic landscape image representing the world "${name}". Theme: ${theme}. Description: ${description}`;
  
  // Add theme-specific style guidance
  let styleGuidance = '';
  switch(theme) {
    case 'fantasy':
      styleGuidance = 'Epic fantasy landscape with magical elements, mystical lighting, ancient architecture, floating islands or magical forests. Style: high fantasy art, detailed digital painting, dramatic lighting.';
      break;
    case 'sci-fi':
    case 'science fiction':
      styleGuidance = 'Futuristic sci-fi landscape with advanced technology, space stations, alien worlds, or cybernetic cities. Style: concept art, sleek futuristic design, neon lighting, technological elements.';
      break;
    case 'horror':
      styleGuidance = 'Dark, ominous landscape with gothic architecture, twisted trees, fog, abandoned buildings, eerie atmosphere. Style: dark gothic art, horror atmosphere, dim lighting, unsettling mood.';
      break;
    case 'western':
      styleGuidance = 'Wild west landscape with desert mesas, old towns, saloons, dusty trails, canyon landscapes. Style: classic western film aesthetic, warm desert colors, vintage atmosphere.';
      break;
    case 'cyberpunk':
      styleGuidance = 'Neon-lit cyberpunk cityscape with towering skyscrapers, flying vehicles, holographic advertisements, rain-soaked streets. Style: cyberpunk aesthetic, neon colors, urban decay, high-tech low-life.';
      break;
    case 'steampunk':
      styleGuidance = 'Victorian-era landscape with steam-powered machinery, brass and copper elements, airships, clockwork mechanisms. Style: steampunk aesthetic, brass and bronze tones, mechanical details.';
      break;
    case 'post-apocalyptic':
      styleGuidance = 'Desolate post-apocalyptic landscape with ruined cities, overgrown vegetation, abandoned vehicles, wasteland atmosphere. Style: post-apocalyptic art, muted colors, decay and reclamation by nature.';
      break;
    case 'biopunk':
    case 'gothic horror':
    case 'biopunk/gothic horror':
      styleGuidance = 'Bio-organic gothic landscape with mutated flora, twisted architecture, bio-mechanical elements, perpetual twilight atmosphere. Style: bio-horror aesthetic, organic and mechanical fusion, dark atmospheric lighting.';
      break;
    default:
      styleGuidance = 'Epic landscape with dramatic lighting and detailed environment. Style: high-quality digital art, cinematic composition, professional concept art.';
  }
  
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
  const theme = world.theme?.toLowerCase() || 'fantasy';
  
  // Use themed placeholder as fallback
  switch(theme) {
    case 'fantasy':
      return `https://picsum.photos/seed/${world.name}/800/600?blur=1`;
    case 'sci-fi':
    case 'science fiction':
      return `https://picsum.photos/seed/${world.name}/800/600?grayscale`;
    case 'horror':
    case 'biopunk':
    case 'gothic horror':
    case 'biopunk/gothic horror':
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

    logger.debug('generate-world-image', 'Starting image generation for world:', body.world.name);

    try {
      // Generate image prompt using AI
      const client = createDefaultGeminiClient();
      const imagePrompt = generateImagePrompt(body.world);
      
      logger.debug('generate-world-image', 'Generated image prompt:', imagePrompt);

      // Generate a detailed description that could be used with real AI image generation
      const promptResponse = await client.generateContent(`
        Generate a detailed, artistic description for an image of this world that could be used as a prompt for an AI image generator like DALL-E or Midjourney. Be very specific about visual elements, atmosphere, lighting, and composition.
        
        ${imagePrompt}
        
        Respond with only the detailed visual description, no other text.
      `);

      const imageDescription = promptResponse.content;
      logger.debug('generate-world-image', 'Generated image description:', imageDescription);

      // Try to generate real AI image using Gemini's image generation model
      let imageUrl = '';
      let aiGenerated = false;
      let placeholder = true;

      // Check if we have Gemini API key for image generation
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (apiKey && apiKey !== 'MOCK_API_KEY') {
        try {
          logger.debug('generate-world-image', 'Attempting Gemini image generation with model: gemini-2.0-flash-preview-image-generation');
          
          // Use the same approach as the portrait generation API
          const imagePromptForGemini = `Create a detailed landscape image representing the world "${body.world.name}". ${imageDescription}

Requirements:
- Epic cinematic landscape
- High quality digital art style
- Professional game concept art
- Rich atmospheric lighting and details
- ${body.world.theme} theme elements
- No text, logos, or watermarks
- Landscape orientation suitable for world imagery`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: imagePromptForGemini }]
                }],
                generationConfig: {
                  responseModalities: ["TEXT", "IMAGE"]
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // Find the image part in the response
            const parts = data.candidates?.[0]?.content?.parts || [];
            const imagePart = parts.find((part: { inlineData?: { mimeType?: string; data?: string } }) => 
              part.inlineData && 
              part.inlineData.mimeType && 
              part.inlineData.mimeType.startsWith('image/')
            );
            
            if (imagePart) {
              // Return the generated image as base64 data URL
              const mimeType = imagePart.inlineData.mimeType;
              const base64Data = imagePart.inlineData.data;
              
              imageUrl = `data:${mimeType};base64,${base64Data}`;
              aiGenerated = true;
              placeholder = false;
              
              logger.debug('generate-world-image', 'Gemini image generated successfully');
            } else {
              logger.warn('generate-world-image', 'No image found in Gemini API response, using fallback');
              imageUrl = generateFallbackImage(body.world);
            }
          } else {
            const errorText = await response.text();
            logger.error('generate-world-image', 'Gemini API Error:', errorText);
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
        description: `A ${body.world.theme} landscape representing ${body.world.name}: ${body.world.description}`,
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