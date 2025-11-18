// src/lib/api/imageGenerationHelpers.ts

import { NextResponse } from 'next/server';
import { getTimestamp } from '@/lib/utils';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ImageGenerationHelpers');

/**
 * Configuration for generating fallback images
 */
interface FallbackImageConfig {
  /** Dicebear variant (e.g., 'avataaars', 'shapes') */
  variant: 'avataaars' | 'shapes';
  /** Seed for dicebear URL (usually item/character name) */
  seed: string;
  /** Image type in response */
  imageType?: 'ai-generated' | 'placeholder';
  /** Additional query parameters for dicebear */
  params?: Record<string, string>;
}

/**
 * Configuration for image generation with mock support
 */
interface ImageGenerationConfig {
  /** The prompt for image generation */
  prompt: string;
  /** Fallback image configuration */
  fallback: FallbackImageConfig;
  /** Logger context name (e.g., 'generate-portrait API') */
  loggerContext: string;
  /** Additional fields to include in response */
  responseFields?: Record<string, unknown>;
}

/**
 * Build a dicebear URL with optional parameters
 */
function buildDicebearUrl(config: FallbackImageConfig): string {
  const baseUrl = `https://api.dicebear.com/7.x/${config.variant}/svg`;
  const params = new URLSearchParams({
    seed: config.seed,
    ...config.params,
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Create a fallback image object
 */
function createFallbackImage(config: FallbackImageConfig, prompt: string) {
  return {
    type: config.imageType || 'placeholder',
    url: buildDicebearUrl(config),
    generatedAt: getTimestamp(),
    prompt,
  };
}

/**
 * Check if we should use mock mode (no API key or MOCK_API_KEY)
 */
export function shouldUseMockMode(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey === 'MOCK_API_KEY';
}

/**
 * Get the Gemini API key if available, null otherwise
 */
export function getGeminiApiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey && apiKey !== 'MOCK_API_KEY' ? apiKey : null;
}

/**
 * Handle image generation with automatic fallback to mock/placeholder images.
 *
 * This centralizes the pattern of:
 * 1. Check for API key
 * 2. Return mock image if no key
 * 3. Try real generation
 * 4. Return fallback if generation fails
 *
 * @param config - Configuration for image generation
 * @returns NextResponse with image data
 */
export async function generateImageWithFallback(
  config: ImageGenerationConfig
): Promise<NextResponse> {
  const apiKey = getGeminiApiKey();

  // Mock mode - return placeholder immediately
  if (!apiKey) {
    const mockImage = createFallbackImage(config.fallback, config.prompt);
    logger.debug(config.loggerContext, 'Using mock image for development');

    return NextResponse.json({
      image: mockImage,
      ...config.responseFields,
    });
  }

  // Try real image generation
  try {
    const generatedImage = await generateImageWithGemini(config.prompt, apiKey);

    if (!generatedImage) {
      logger.warn(config.loggerContext, 'Image generation failed, using fallback');
      const fallbackImage = createFallbackImage(config.fallback, config.prompt);

      return NextResponse.json({
        image: fallbackImage,
        ...config.responseFields,
      });
    }

    // Success - return generated image
    const imageData = {
      type: 'ai-generated' as const,
      url: generatedImage.url,
      generatedAt: getTimestamp(),
      prompt: config.prompt,
    };

    logger.debug(config.loggerContext, 'Image generated successfully');

    return NextResponse.json({
      image: imageData,
      ...config.responseFields,
    });

  } catch (error) {
    logger.error(config.loggerContext, 'Image generation error:', error);
    const fallbackImage = createFallbackImage(config.fallback, config.prompt);

    return NextResponse.json({
      image: fallbackImage,
      ...config.responseFields,
    });
  }
}
