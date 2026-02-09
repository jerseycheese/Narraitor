import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import type { StoryEnding } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import type { Character } from '@/types/character.types';
import Logger from '@/lib/utils/logger';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import { getGenreStyleGuidance, getGenreFallbackImage } from '@/lib/utils/genrePromptGuide';

const logger = new Logger('EndingImageAPI');

// Constants for prompt generation limits
const MAX_RECENT_SEGMENTS = 3;
const MAX_CONTEXT_CHARS = 200;
const MAX_EPILOGUE_CHARS = 300;
const MAX_LEGACY_CHARS = 200;
const MAX_IMPACT_CHARS = 200;

interface GenerateEndingImageRequest {
  ending: StoryEnding;
  world?: World;
  character?: Character;
  recentNarrative?: string[];
  promptOnly?: boolean;
}

// Generate a detailed image prompt based on ending characteristics
function generateImagePrompt(ending: StoryEnding, world?: World, character?: Character, recentNarrative?: string[]): string {
  const genre = world?.genre?.toLowerCase() || 'fantasy';
  const worldName = world?.name || 'Unknown Realm';
  const characterName = character?.name || 'The Hero';
  const tone = ending.tone;
  
  // Create a detailed prompt for ending image generation
  const basePrompt = `Create a highly detailed, cinematic image representing the conclusion of${characterName}'s story in${worldName}. This is a${tone}ending to their journey.`;
  
  // Add tone-specific visual guidance
  let toneGuidance = '';
  switch(tone) {
    case 'triumphant':
      toneGuidance = 'Victorious, celebratory atmosphere with golden lighting, raised banners, cheering crowds, or the hero standing tall against a bright sky. Convey achievement and success.';
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
  
  // Get genre-specific style guidance from shared utility
  const styleGuidance = getGenreStyleGuidance(genre, 'ending');
  
  // Include brief narrative context if available
  let narrativeContext = '';
  if (recentNarrative && recentNarrative.length > 0) {
    const recentEvents = recentNarrative.slice(-MAX_RECENT_SEGMENTS).join('').substring(0, MAX_CONTEXT_CHARS);
    narrativeContext = `Recent story context:${recentEvents}...`;
  }
  
  return `${basePrompt}${toneGuidance}${styleGuidance}${narrativeContext}Story Ending Context: - Epilogue:${ending.epilogue.substring(0, MAX_EPILOGUE_CHARS)}... - Character Legacy:${ending.characterLegacy.substring(0, MAX_LEGACY_CHARS)}... - World Impact:${ending.worldImpact.substring(0, MAX_IMPACT_CHARS)}... Requirements: - Ultra-high quality, 4K resolution concept art - Cinematic composition showing story conclusion - Emotional depth matching the${tone}tone - Rich detail and atmospheric depth - Professional game/film concept art style - Wide landscape orientation (3:1 aspect ratio preferred, suitable for hero banner) - Horizontal panoramic composition - Show the end of a journey, conclusion, or resolution - Focus on${characterName}or the aftermath of their actions - No text, logos, or watermarks - Colors and mood appropriate to the${tone}ending tone`;
}

// Generate fallback placeholder if AI generation fails
function generateFallbackImage(ending: StoryEnding, world?: World): string {
  const genre = world?.genre || 'fantasy';
  const tone = ending.tone;
  const seed = `${world?.name || 'ending'}-${ending.id}`;

  // Use tone-themed placeholder with genre fallback
  return getGenreFallbackImage(genre, seed, tone);
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
      const promptResponse = await client.generateContent(`Generate a detailed, artistic description for an image showing the conclusion of this story that could be used as a prompt for an AI image generator. Be very specific about visual elements, atmosphere, lighting, composition, and emotional tone.${imagePrompt}Focus on creating a powerful final image that captures the essence of this${body.ending.tone}ending. Respond with only the detailed visual description, no other text.`);

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
          
          const imagePromptForGemini = `Create a cinematic ending image for this story conclusion.${imageDescription}Requirements: - Epic cinematic scene showing story conclusion - High quality digital art style - Professional game/film concept art - Rich atmospheric lighting and emotional depth -${body.ending.tone}tone and mood -${body.world?.genre || 'fantasy'}genre elements - Focus on the end of the journey or its aftermath - No text, logos, or watermarks - Wide landscape orientation (3:1 aspect ratio, panoramic hero banner format) - Horizontal panoramic composition suitable for wide hero display`;

          const generatedImage = await generateImageWithGemini(imagePromptForGemini, apiKey);

          if (generatedImage) {
            imageUrl = generatedImage.url;
            aiGenerated = true;
            placeholder = false;

            logger.debug('generate-ending-image', 'Gemini image generated successfully');
          } else {
            logger.warn('generate-ending-image', 'Image generation failed, using fallback');
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
        description: `A${body.ending.tone}ending scene for${body.character?.name || 'the hero'}in${body.world?.name || 'the realm'}`,
        placeholder: true,
        aiGenerated: false
      });
    }

  } catch (error) {
    logger.error('generate-ending-image', 'Ending image generation failed:', error);
    return NextResponse.json(
      { error: 'Unable to load ending image. Please try again.' },
      { status: 500 }
    );
  }
}
