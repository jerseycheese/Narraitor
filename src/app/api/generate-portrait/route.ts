// src/app/api/generate-portrait/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/utils/logger';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

const logger = new Logger('API');

interface GeneratePortraitRequest {
  character: Character;
  world?: World;
}

export async function POST(request: NextRequest) {
  try {
    const { character, world } = await request.json() as GeneratePortraitRequest;
    
    if (!character) {
      return NextResponse.json(
        { error: 'Character is required' },
        { status: 400 }
      );
    }

    logger.debug('generate-portrait API', 'Generating portrait for character:', character.name);

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      // Return a mock portrait for development
      const mockPortrait = {
        type: 'ai-generated' as const,
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character.name)}`,
        generatedAt: new Date().toISOString(),
        prompt: `Portrait of ${character.name}`
      };
      
      logger.debug('generate-portrait API', 'Using mock portrait for development:', character.name);
      return NextResponse.json({ portrait: mockPortrait });
    }

    // Build portrait prompt
    const isKnownFigure = character.background.isKnownFigure;
    const prompt = `Create a professional portrait of ${character.name}, ${character.background.physicalDescription || 'a person with distinctive features'}. ${isKnownFigure ? `This should be recognizable as ${character.name} from the source material.` : 'This is an original character.'} Style: realistic portrait, professional lighting, clear facial features, suitable for a character profile. ${world?.theme ? `Setting theme: ${world.theme}.` : ''}`;
    
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
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character.name)}`,
        generatedAt: new Date().toISOString(),
        prompt: prompt
      };
      
      return NextResponse.json({ portrait: fallbackPortrait });
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
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(character.name)}`,
        generatedAt: new Date().toISOString(),
        prompt: prompt
      };
      
      return NextResponse.json({ portrait: fallbackPortrait });
    }

    // Return the generated portrait
    const mimeType = imagePart.inlineData.mimeType;
    const base64Data = imagePart.inlineData.data;
    
    const portrait = {
      type: 'ai-generated' as const,
      url: `data:${mimeType};base64,${base64Data}`,
      generatedAt: new Date().toISOString(),
      prompt: prompt
    };
    
    logger.debug('generate-portrait API', 'Portrait generated successfully for:', character.name);

    return NextResponse.json({ portrait });

  } catch (error) {
    logger.error('generate-portrait API', 'Portrait generation failed:', error);
    
    // Return mock portrait as fallback
    const fallbackPortrait = {
      type: 'ai-generated' as const,
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(Math.random().toString())}`,
      generatedAt: new Date().toISOString(),
      prompt: `Portrait fallback`
    };
    
    return NextResponse.json({ portrait: fallbackPortrait });
  }
}