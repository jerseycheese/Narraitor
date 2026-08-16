// src/app/api/generate-item-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/utils/logger';
import type { InventoryItem } from '@/types/inventory.types';
import { buildItemPrompt } from '@/lib/ai/itemImageGenerator';
import { generateImageWithFallback } from '@/lib/api/imageGenerationHelpers';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';

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

    logger.debug('generate-item-image API', 'Generating image for item:', item.name);

    const prompt = buildItemPrompt(item);

    // Length rather than text - a truncated prompt is still the player's content.
    logger.debug('generate-item-image API', 'Prompt built', { length: prompt.length });

    // Use centralized helper for image generation with fallback
    return generateImageWithFallback({
      prompt,
      apiKey: resolveApiKey(request),
      fallback: {
        variant: 'shapes',
        seed: item.name,
        imageType: 'placeholder',
      },
      loggerContext: 'generate-item-image API',
    });

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
