import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import type { StoryEnding } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import type { Character } from '@/types/character.types';
import Logger from '@/lib/utils/logger';

const logger = new Logger('EndingImageAPI');

interface GenerateEndingImageRequest {
  ending: StoryEnding;
  world?: World;
  character?: Character;
  recentNarrative?: string[];
  promptOnly?: boolean;
}

// Generate a detailed image prompt based on ending characteristics
function generateImagePrompt(ending: StoryEnding, world?: World, character?: Character, recentNarrative?: string[]): string {
  const theme = world?.theme?.toLowerCase() || 'fantasy';
  const worldName = world?.name || 'Unknown Realm';
  const characterName = character?.name || 'The Hero';
  const tone = ending.tone;
  
  // Create a detailed prompt for ending image generation
  const basePrompt = `Create a highly detailed, cinematic image representing the conclusion of ${characterName}'s story in ${worldName}. This is a ${tone} ending to their journey.`;
  
  // Add tone-specific visual guidance
  let toneGuidance = '';
  switch(tone) {
    case 'triumphant':
      toneGuidance = 'Victorious, celebratory atmosphere with golden lighting, raised banners, cheering crowds, or the hero standing tall against a bright sky. Convey achievement and success.';
      break;
    case 'bittersweet':
      toneGuidance = 'Mixed emotions with contrasting elements - perhaps a sunset/dawn scene, the hero looking back at what was lost while moving toward something new. Soft, melancholic lighting with hints of hope.';
      break;
    case 'mysterious':
      toneGuidance = 'Enigmatic and open-ended with misty atmosphere, mysterious doorways, paths leading into the unknown, or the hero silhouetted against an uncertain horizon. Ethereal, questioning mood.';
      break;
    case 'tragic':
      toneGuidance = 'Somber, melancholic atmosphere with muted colors, perhaps rain or storm clouds, memorials or ruins, conveying loss and sacrifice. Respectful, sorrowful mood.';
      break;
    case 'hopeful':
      toneGuidance = 'Optimistic and forward-looking with bright, warm lighting, new beginnings imagery like sunrise, open roads, or the hero walking toward a bright future. Uplifting, inspiring mood.';
      break;
    default:
      toneGuidance = 'Reflective ending atmosphere with dramatic lighting and emotional depth.';
  }
  
  // Add theme-specific style guidance
  let styleGuidance = '';
  switch(theme) {
    case 'fantasy':
      styleGuidance = 'Epic fantasy setting with magical elements, ancient architecture, mystical lighting. Style: high fantasy art, detailed digital painting, cinematic composition.';
      break;
    case 'sci-fi':
    case 'science fiction':
      styleGuidance = 'Futuristic sci-fi setting with advanced technology, space stations, alien worlds. Style: concept art, sleek futuristic design, cinematic sci-fi aesthetic.';
      break;
    case 'horror':
      styleGuidance = 'Gothic horror setting with dark atmosphere, but ending-appropriate mood. Style: atmospheric horror art, dramatic shadows, emotional depth.';
      break;
    case 'western':
      styleGuidance = 'Wild west setting with desert landscapes, frontier towns, classic western imagery. Style: classic western film aesthetic, warm desert colors, cinematic composition.';
      break;
    case 'cyberpunk':
      styleGuidance = 'Cyberpunk cityscape with neon lighting, urban environment, high-tech elements. Style: cyberpunk aesthetic, dramatic neon lighting, urban atmosphere.';
      break;
    case 'steampunk':
      styleGuidance = 'Victorian steampunk setting with brass machinery, clockwork elements, industrial atmosphere. Style: steampunk aesthetic, warm brass tones, mechanical details.';
      break;
    case 'post-apocalyptic':
      styleGuidance = 'Post-apocalyptic landscape with ruins and reclaimed nature, but showing the ending\'s emotional tone. Style: post-apocalyptic art, atmospheric depth.';
      break;
    default:
      styleGuidance = 'Epic setting with dramatic lighting and detailed environment. Style: high-quality digital art, cinematic composition.';
  }
  
  // Include brief narrative context if available
  let narrativeContext = '';
  if (recentNarrative && recentNarrative.length > 0) {
    const recentEvents = recentNarrative.slice(-3).join(' ').substring(0, 200);
    narrativeContext = `Recent story context: ${recentEvents}...`;
  }
  
  return `${basePrompt}

${toneGuidance}

${styleGuidance}

${narrativeContext}

Story Ending Context:
- Epilogue: ${ending.epilogue.substring(0, 300)}...
- Character Legacy: ${ending.characterLegacy.substring(0, 200)}...
- World Impact: ${ending.worldImpact.substring(0, 200)}...

Requirements:
- Ultra-high quality, 4K resolution concept art
- Cinematic composition showing story conclusion
- Emotional depth matching the ${tone} tone
- Rich detail and atmospheric depth
- Professional game/film concept art style
- Landscape orientation (16:9 or similar)
- Show the end of a journey, conclusion, or resolution
- Focus on ${characterName} or the aftermath of their actions
- No text, logos, or watermarks
- Colors and mood appropriate to the ${tone} ending tone`;
}

// Generate fallback placeholder if AI generation fails
function generateFallbackImage(ending: StoryEnding, world?: World): string {
  const tone = ending.tone;
  const seed = `${world?.name || 'ending'}-${ending.id}`;
  
  // Use tone-themed placeholder as fallback
  switch(tone) {
    case 'triumphant':
      return `https://picsum.photos/seed/${seed}/800/600?sepia`;
    case 'bittersweet':
      return `https://picsum.photos/seed/${seed}/800/600?blur=1`;
    case 'mysterious':
      return `https://picsum.photos/seed/${seed}/800/600?grayscale&blur=2`;
    case 'tragic':
      return `https://picsum.photos/seed/${seed}/800/600?grayscale`;
    case 'hopeful':
      return `https://picsum.photos/seed/${seed}/800/600`;
    default:
      return `https://picsum.photos/seed/${seed}/800/600`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateEndingImageRequest;
    
    if (!body.ending) {
      return NextResponse.json(
        { error: 'Ending data is required' },
        { status: 400 }
      );
    }

    logger.debug('generate-ending-image', 'Starting image generation for ending:', body.ending.id);

    try {
      // Generate image prompt using AI
      const client = createDefaultGeminiClient();
      const imagePrompt = generateImagePrompt(body.ending, body.world, body.character, body.recentNarrative);
      
      logger.debug('generate-ending-image', 'Generated image prompt:', imagePrompt);

      // Generate a detailed description that could be used with real AI image generation
      const promptResponse = await client.generateContent(`
        Generate a detailed, artistic description for an image showing the conclusion of this story that could be used as a prompt for an AI image generator. Be very specific about visual elements, atmosphere, lighting, composition, and emotional tone.
        
        ${imagePrompt}
        
        Focus on creating a powerful final image that captures the essence of this ${body.ending.tone} ending.
        
        Respond with only the detailed visual description, no other text.
      `);

      const imageDescription = promptResponse.content;
      logger.debug('generate-ending-image', 'Generated image description:', imageDescription);

      // If promptOnly flag is set, return just the prompt information
      if (body.promptOnly) {
        return NextResponse.json({ 
          prompt: imagePrompt,
          imageGenerationPrompt: imageDescription,
          description: imageDescription,
          promptOnly: true
        });
      }

      // Try to generate real AI image using Gemini's image generation model
      let imageUrl = '';
      let aiGenerated = false;
      let placeholder = true;

      // Check if we have Gemini API key for image generation
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (apiKey && apiKey !== 'MOCK_API_KEY') {
        try {
          logger.debug('generate-ending-image', 'Attempting Gemini image generation');
          
          const imagePromptForGemini = `Create a cinematic ending image for this story conclusion. ${imageDescription}

Requirements:
- Epic cinematic scene showing story conclusion
- High quality digital art style  
- Professional game/film concept art
- Rich atmospheric lighting and emotional depth
- ${body.ending.tone} tone and mood
- ${body.world?.theme || 'fantasy'} theme elements
- Focus on the end of the journey or its aftermath
- No text, logos, or watermarks
- Landscape orientation suitable for story ending imagery`;

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
              
              logger.debug('generate-ending-image', 'Gemini image generated successfully');
            } else {
              logger.warn('generate-ending-image', 'No image found in Gemini API response, using fallback');
              imageUrl = generateFallbackImage(body.ending, body.world);
            }
          } else {
            const errorText = await response.text();
            logger.error('generate-ending-image', 'Gemini API Error:', errorText);
            imageUrl = generateFallbackImage(body.ending, body.world);
          }

        } catch (imageGenError) {
          logger.error('generate-ending-image', 'Gemini image generation failed, using fallback:', imageGenError);
          imageUrl = generateFallbackImage(body.ending, body.world);
        }
      } else {
        logger.debug('generate-ending-image', 'No Gemini API key configured, using fallback');
        imageUrl = generateFallbackImage(body.ending, body.world);
      }
      
      return NextResponse.json({ 
        imageUrl,
        description: imageDescription,
        prompt: imagePrompt,
        placeholder,
        aiGenerated,
        tone: body.ending.tone,
        // Include the prompt for future use
        imageGenerationPrompt: imageDescription,
        // Include service info for debugging
        service: aiGenerated ? 'gemini-image-generation' : 'fallback'
      });

    } catch (aiError) {
      logger.error('generate-ending-image', 'AI image prompt generation failed:', aiError);
      
      // Fallback to simple placeholder
      const fallbackUrl = generateFallbackImage(body.ending, body.world);
      
      return NextResponse.json({ 
        imageUrl: fallbackUrl,
        description: `A ${body.ending.tone} ending scene for ${body.character?.name || 'the hero'} in ${body.world?.name || 'the realm'}`,
        placeholder: true,
        aiGenerated: false
      });
    }

  } catch (error) {
    logger.error('generate-ending-image', 'Ending image generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate ending image. Please try again.' },
      { status: 500 }
    );
  }
}