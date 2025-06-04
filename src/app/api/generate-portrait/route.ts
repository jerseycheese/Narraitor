// src/app/api/generate-portrait/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/utils/logger';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

const logger = new Logger('API');

/**
 * Single function to build portrait prompts with AI-powered actor detection
 */
async function buildPortraitPrompt(
  characterName: string,
  physicalDescription: string,
  worldTheme: string,
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
    const mockCharacter = {
      id: 'detection-temp',
      name: characterName,
      background: {
        physicalDescription: physicalDescription,
        history: '',
        personality: '',
        goals: [],
        fears: []
      }
    } as Character;
    
    logger.debug('generate-portrait API', 'Calling buildPortraitPrompt directly to avoid image generation');
    
    // Call buildPortraitPrompt directly to avoid the image generation requirement
    const prompt = await generator.buildPortraitPrompt(mockCharacter, {
      worldTheme: worldTheme
    });
    
    logger.debug('generate-portrait API', 'AI detection successful, prompt:', prompt.substring(0, 100) + '...');
    return prompt;
    
  } catch (error) {
    logger.debug('generate-portrait API', 'AI detection failed, using fallback. Error:', error);
    
    // Fallback to basic prompt if AI detection fails
    return `Create a professional portrait of ${characterName}, ${physicalDescription}. ${isKnownFigure ? `This should be recognizable as ${characterName} from the source material.` : 'This is an original character.'} Style: realistic portrait, professional lighting, clear facial features, suitable for a character profile. Setting theme: ${worldTheme}.`;
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
        const worldTheme = world?.theme || 'Modern';
        const isKnownFigure = character?.background?.isKnownFigure;
        
        const prompt = await buildPortraitPrompt(characterName, physicalDesc, worldTheme, isKnownFigure);
        
        return NextResponse.json({ 
          prompt: prompt,
          promptOnly: true
        });
      } else {
        // Build a prompt for actual image generation
        const characterName = character?.name || 'character';
        const physicalDesc = customDescription || character?.background?.physicalDescription || 'No specific appearance described';
        const worldTheme = world?.theme || 'fantasy';
        const isKnownFigure = character?.background?.isKnownFigure;
        
        prompt = await buildPortraitPrompt(characterName, physicalDesc, worldTheme, isKnownFigure);
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

    logger.debug('generate-portrait API', 'Generating portrait with prompt:', prompt.substring(0, 100) + '...');

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      // Return a mock portrait for development
      const mockPortrait = {
        type: 'ai-generated' as const,
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character?.name || 'unknown')}`,
        generatedAt: new Date().toISOString(),
        prompt: prompt
      };
      
      logger.debug('generate-portrait API', 'Using mock portrait for development');
      return NextResponse.json({ 
        portrait: mockPortrait,
        image: mockPortrait.url // For backward compatibility
      });
    }
    
    // Call Google's Gemini API for image generation
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
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('generate-portrait API', 'Gemini API Error:', errorText);
      
      // Return mock portrait as fallback
      const fallbackPortrait = {
        type: 'ai-generated' as const,
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character?.name || 'fallback')}`,
        generatedAt: new Date().toISOString(),
        prompt: prompt
      };
      
      return NextResponse.json({ 
        portrait: fallbackPortrait,
        image: fallbackPortrait.url // For backward compatibility
      });
    }

    const data = await response.json();
    
    // Find the image part in the response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: { inlineData?: { mimeType?: string; data?: string } }) => 
      part.inlineData && 
      part.inlineData.mimeType && 
      part.inlineData.mimeType.startsWith('image/')
    );
    
    if (!imagePart) {
      logger.warn('generate-portrait API', 'No image found in API response, using fallback');
      
      // Return mock portrait as fallback
      const fallbackPortrait = {
        type: 'ai-generated' as const,
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character?.name || 'fallback')}`,
        generatedAt: new Date().toISOString(),
        prompt: prompt
      };
      
      return NextResponse.json({ 
        portrait: fallbackPortrait,
        image: fallbackPortrait.url // For backward compatibility
      });
    }

    // Return the generated portrait
    const mimeType = imagePart.inlineData.mimeType;
    const base64Data = imagePart.inlineData.data;
    
    const portraitData = {
      type: 'ai-generated' as const,
      url: `data:${mimeType};base64,${base64Data}`,
      generatedAt: new Date().toISOString(),
      prompt: prompt
    };
    
    logger.debug('generate-portrait API', 'Portrait generated successfully');

    return NextResponse.json({
      portrait: portraitData,
      image: `data:${mimeType};base64,${base64Data}` // For backward compatibility
    });

  } catch (error) {
    logger.error('generate-portrait API', 'Portrait generation failed:', error);
    
    // Return mock portrait as fallback
    const fallbackPortrait = {
      type: 'ai-generated' as const,
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(Math.random().toString())}`,
      generatedAt: new Date().toISOString(),
      prompt: `Portrait fallback - character: ${!!character}, promptOnly: ${body.promptOnly}, bodyKeys: ${Object.keys(body).join(',')}`
    };
    
    return NextResponse.json({ 
      portrait: fallbackPortrait,
      image: fallbackPortrait.url // For backward compatibility
    });
  }
}