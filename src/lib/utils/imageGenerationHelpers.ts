/**
 * Shared utilities for API image generation routes
 * Consolidates common patterns across portrait, world, and ending image generation
 */

import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import { getTimestamp } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ImageGenerationHelpers');

/**
 * Checks if API key is valid and not a mock
 */
export function hasValidAPIKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !!(apiKey && apiKey !== 'MOCK_API_KEY');
}

/**
 * Gets the API key from environment
 */
export function getAPIKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

/**
 * Checks if we should use mock mode (no API key or mock key)
 */
export function isMockMode(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey === 'MOCK_API_KEY';
}

/**
 * Response structure for generated images
 */
export interface GeneratedImageResponse {
  url: string;
  type: 'ai-generated';
  generatedAt: string;
  prompt: string;
  aiGenerated?: boolean;
  placeholder?: boolean;
}

/**
 * Creates a mock response for development/fallback scenarios
 */
export function createMockImageResponse(
  fallbackUrl: string,
  prompt: string
): GeneratedImageResponse {
  return {
    type: 'ai-generated' as const,
    url: fallbackUrl,
    generatedAt: getTimestamp(),
    prompt,
    aiGenerated: false,
    placeholder: true
  };
}

/**
 * Creates a successful AI-generated image response
 */
export function createSuccessImageResponse(
  imageUrl: string,
  prompt: string
): GeneratedImageResponse {
  return {
    type: 'ai-generated' as const,
    url: imageUrl,
    generatedAt: getTimestamp(),
    prompt,
    aiGenerated: true,
    placeholder: false
  };
}

/**
 * Generates an image with Gemini or returns fallback
 * Centralizes the generation flow with consistent error handling
 */
export async function generateImageOrFallback(
  prompt: string,
  fallbackUrl: string,
  context: string = 'image'
): Promise<GeneratedImageResponse> {
  const apiKey = getAPIKey();

  // Return mock in development mode
  if (isMockMode()) {
    logger.debug(context, 'Using mock mode (no valid API key)');
    return createMockImageResponse(fallbackUrl, prompt);
  }

  // Try to generate with Gemini
  try {
    logger.debug(context, 'Attempting Gemini image generation');
    const generatedImage = await generateImageWithGemini(prompt, apiKey!);

    if (generatedImage) {
      logger.debug(context, 'Image generated successfully');
      return createSuccessImageResponse(generatedImage.url, prompt);
    } else {
      logger.warn(context, 'Image generation returned null, using fallback');
      return createMockImageResponse(fallbackUrl, prompt);
    }
  } catch (error) {
    logger.error(context, 'Image generation failed:', error);
    return createMockImageResponse(fallbackUrl, prompt);
  }
}
