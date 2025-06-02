// src/app/api/generate-portrait/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { getDefaultConfig } from '@/lib/ai/config';
import type { Character } from '@/types/character.types';
import type { World } from '@/types/world.types';

interface PortraitRequestBody {
  prompt?: string;
  character?: Character;
  world?: World;
  customDescription?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PortraitRequestBody = await request.json();
    
    // Handle both old format (prompt only) and new format (character + world)
    if (body.character) {
      // New format: character + world objects - use full portrait generation pipeline
      const config = getDefaultConfig();
      const client = new GeminiClient(config);
      const generator = new PortraitGenerator(client);
      
      // Build the options for portrait generation
      const options = {
        worldTheme: body.world?.theme,
        isKnownFigure: body.character.background?.isKnownFigure
      };
      
      // Override physical description if provided
      let character = body.character;
      if (body.customDescription) {
        character = {
          ...character,
          background: {
            ...character.background,
            physicalDescription: body.customDescription
          }
        };
      }
      
      console.log('[Portrait API] Generating portrait for character:', {
        name: character.name,
        worldTheme: options.worldTheme,
        isKnownFigure: options.isKnownFigure,
        physicalDescription: character.background?.physicalDescription
      });
      
      try {
        // Use the full generatePortrait method which handles the entire pipeline
        const portraitResult = await generator.generatePortrait(character, options);
        
        console.log('[Portrait API] Successfully generated portrait for:', character.name);
        
        // Return the result directly for character/world format
        return NextResponse.json({
          portrait: portraitResult
        });
      } catch (portraitError) {
        console.error('[Portrait API] Portrait generation failed:', portraitError);
        return NextResponse.json(
          { 
            error: 'Portrait generation failed',
            details: portraitError instanceof Error ? portraitError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else if (body.prompt) {
      // Old format: direct prompt - continue with existing Gemini API flow
    } else {
      return NextResponse.json(
        { error: 'Either prompt or character data is required' },
        { status: 400 }
      );
    }
    
    // Continue with old prompt-based flow for backwards compatibility
    const prompt = body.prompt as string;

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Call Google's Gemini API from the server using secure header authentication
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
            parts: [
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorText: errorText
      });
      
      return NextResponse.json(
        { 
          error: `Gemini API failed: ${response.status} ${response.statusText}`,
          details: errorText,
          apiEndpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Look for image in the response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('API Response structure issue:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasFirstCandidate: !!data.candidates?.[0],
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts,
        fullResponse: JSON.stringify(data, null, 2)
      });
      
      return NextResponse.json(
        { 
          error: 'No content in API response',
          details: 'Missing candidates, content, or parts in response'
        },
        { status: 500 }
      );
    }

    // Find the image part in the response
    type ContentPart = { text?: string; inlineData?: { mimeType?: string; data?: string } };
    const parts = data.candidates[0].content.parts as ContentPart[];
    const imagePart = parts.find((part) => 
      part.inlineData && 
      part.inlineData.mimeType && 
      part.inlineData.mimeType.startsWith('image/')
    );
    
    if (!imagePart) {
      console.error('No image part found in response:', {
        partsCount: parts.length,
        partTypes: parts.map((p) => {
          if ('text' in p) return 'text';
          if ('inlineData' in p && p.inlineData) return `inlineData(${p.inlineData.mimeType || 'no-mime'})`;
          return 'unknown';
        }),
        parts: parts
      });
      
      return NextResponse.json(
        { 
          error: 'No image found in API response',
          details: `Found ${parts.length} parts but no image data`
        },
        { status: 500 }
      );
    }

    // Return the image data (we already checked that inlineData exists above)
    const mimeType = imagePart.inlineData!.mimeType;
    const base64Data = imagePart.inlineData!.data;
    
    const imageUrl = `data:${mimeType};base64,${base64Data}`;
    
    // Return in both old and new formats for compatibility
    if (body.character) {
      // New format: return portrait object for character creation
      return NextResponse.json({
        portrait: {
          type: 'ai-generated',
          url: imageUrl,
          generatedAt: new Date().toISOString(),
          prompt: prompt
        }
      });
    } else {
      // Old format: return image and prompt directly
      return NextResponse.json({
        image: imageUrl,
        prompt: prompt
      });
    }

  } catch (error) {
    console.error('Portrait generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}