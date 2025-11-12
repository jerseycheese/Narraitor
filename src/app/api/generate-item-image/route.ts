// src/app/api/generate-item-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/utils/logger';
import type { InventoryItem } from '@/types/inventory.types';
import type { GeneratedImage } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import { ItemImageGenerator } from '@/lib/ai/itemImageGenerator';

const logger = new Logger('API');

/**
 * Generate AI images for inventory items.
 *
 * Accepts:
 * - { item: InventoryItem, genre?: string }
 *
 * Returns: GeneratedImage object
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.debug('generate-item-image API', 'Request body keys:', Object.keys(body));

    // Validate input
    if (!body.item) {
      return NextResponse.json(
        { error: 'Item object is required' },
        { status: 400 }
      );
    }

    const item: InventoryItem = body.item;
    const genre: string | undefined = body.genre;

    logger.debug('generate-item-image API', 'Generating image for item:', item.name);

    // Build the prompt using ItemImageGenerator
    const generator = new ItemImageGenerator();
    const prompt = await generator.buildItemPrompt(item, genre);

    logger.debug('generate-item-image API', 'Generated prompt:', prompt.substring(0, 100) + '...');

    const apiKey = process.env.GEMINI_API_KEY;

    // Development mode - return mock image
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      const mockImage: GeneratedImage = {
        type: 'placeholder',
        url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}`,
        generatedAt: getTimestamp(),
        prompt: prompt,
      };

      logger.debug('generate-item-image API', 'Using mock image for development');
      return NextResponse.json({ image: mockImage });
    }

    // Call Gemini API for actual image generation
    const generatedImage = await generateImageWithGemini(prompt, apiKey);

    if (!generatedImage) {
      logger.warn('generate-item-image API', 'Image generation failed, using fallback');

      // Return placeholder fallback
      const fallbackImage: GeneratedImage = {
        type: 'placeholder',
        url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name)}-fallback`,
        generatedAt: getTimestamp(),
        prompt: prompt,
      };

      return NextResponse.json({ image: fallbackImage });
    }

    // Return the generated image
    const imageData: GeneratedImage = {
      type: 'ai-generated',
      url: generatedImage.url,
      generatedAt: getTimestamp(),
      prompt: prompt,
    };

    logger.debug('generate-item-image API', 'Image generated successfully');

    return NextResponse.json({ image: imageData });

  } catch (error) {
    logger.error('generate-item-image API', 'Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate item image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
