// src/app/api/generate-portrait/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/utils/logger';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';
import { truncate, getTimestamp } from '@/lib/utils';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';

const logger = new Logger('API');

/**
 * Single function to build portrait prompts with AI-powered actor detection
 */
async function buildPortraitPrompt(
  characterName: string,
  physicalDescription: string,
  worldGenre: string,
  isKnownFigure?: boolean
): Promise<string> {
  try {
    logger.debug('generate-portrait API', 'Starting AI character detection for:', characterName);
    
    // Use only the character detection part, not the full image generation
    const { PortraitGenerator } = await import('@/lib/ai/portraitGenerator');
    const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
    
    logger.debug('generate-portrait API', 'Creating AI client and generator');
    const aiClient = createDefaultGeminiClient();
    const generator = new PortraitGenerator(aiClient);
    
    // Create a minimal character object for detection
    const mockCharacter: Character = {
      id: 'detection-temp',
      name: characterName,
      description: '',
      worldId: 'temp',
      background: {
        physicalDescription: physicalDescription,
        history: '',
        personality: '',
        goals: [],
        fears: [],
        relationships: []
      },
      attributes: [],
      skills: [],
      inventory: {
        characterId: 'detection-temp',
        items: [],
        capacity: 100,
        categories: [],
        itemOrder: []
      },
      status: {
        health: 100,
        maxHealth: 100,
        conditions: []
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };
    
    logger.debug('generate-portrait API', 'Calling buildPortraitPrompt directly to avoid image generation');
    
    // Call buildPortraitPrompt directly to avoid the image generation requirement
    const prompt = await generator.buildPortraitPrompt(mockCharacter, {
      worldGenre: worldGenre
    });
    
    logger.debug('generate-portrait API', 'AI detection successful, prompt:', truncate(prompt, 100));
    return prompt;
    
  } catch (error) {
    logger.debug('generate-portrait API', 'AI detection failed, using fallback. Error:', error);
    
    // Fallback to basic prompt if AI detection fails
    return `Create a professional portrait of ${characterName}, ${physicalDescription}. ${isKnownFigure ? `This should be recognizable as ${characterName} from the source material.` : 'This is an original character.'} Style: realistic portrait, professional lighting, clear facial features, suitable for a character profile. Setting genre: ${worldGenre}.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.debug('generate-portrait API', 'Request body keys:', Object.keys(body));
    logger.debug('generate-portrait API', 'Request body:', JSON.stringify(body, null, 2));
    
    // Handle different input formats
    let prompt: string;
    let character: Character | undefined;
    let world: World | undefined;
    
    if (typeof body === 'string') {
      prompt = body;
    } else if (body.prompt) {
      // Direct prompt format
      prompt = body.prompt;
    } else if (body.character) {
      // Character + world format - need to build prompt
      character = body.character;
      world = body.world;
      const customDescription = body.customDescription;
      const promptOnly = body.promptOnly;
      
      logger.debug('generate-portrait API', 'Character format detected, promptOnly:', promptOnly);
      
      if (promptOnly) {
        logger.debug('generate-portrait API', 'Using promptOnly mode');
        
        const characterName = character?.name || 'Unknown';
        const physicalDesc = customDescription || character?.background?.physicalDescription || '';
        const worldGenre = world?.genre || 'modern';
        const isKnownFigure = character?.background?.isKnownFigure;
        
        const prompt = await buildPortraitPrompt(characterName, physicalDesc, worldGenre, isKnownFigure);
        
        return NextResponse.json({ 
          prompt: prompt,
          promptOnly: true
        });
      } else {
        // Build a prompt for actual image generation
        const characterName = character?.name || 'character';
        const physicalDesc = customDescription || character?.background?.physicalDescription || 'No specific appearance described';
        const worldGenre = world?.genre || 'fantasy';
        const isKnownFigure = character?.background?.isKnownFigure;
        
        prompt = await buildPortraitPrompt(characterName, physicalDesc, worldGenre, isKnownFigure);
      }
    } else {
      return NextResponse.json(
        { error: 'Either prompt string or character object is required' },
        { status: 400 }
      );
    }
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt could not be determined from input' },
        { status: 400 }
      );
    }

    logger.debug('generate-portrait API', 'Generating portrait with prompt:', truncate(prompt, 100));

    // Generate fallback URL for dicebear avatar
    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character?.name || 'unknown')}`;

    // Use shared helper for image generation
    const { generateImageOrFallback } = await import('@/lib/utils/imageGenerationHelpers');
    const portraitData = await generateImageOrFallback(
      prompt,
      fallbackUrl,
      'generate-portrait API'
    );

    logger.debug('generate-portrait API', 'Portrait generation completed');

    return NextResponse.json({
      portrait: portraitData,
      image: portraitData.url // For backward compatibility
    });

  } catch (error) {
    logger.error('generate-portrait API', 'Portrait generation failed:', error);

    // Return mock portrait as fallback
    const { createMockImageResponse } = await import('@/lib/utils/imageGenerationHelpers');
    const fallbackPortrait = createMockImageResponse(
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(Math.random().toString())}`,
      `Portrait fallback due to error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return NextResponse.json({
      portrait: fallbackPortrait,
      image: fallbackPortrait.url // For backward compatibility
    });
  }
}
