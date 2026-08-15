// src/lib/api/imageGenerationHelpers.ts

import { NextResponse } from 'next/server';
import { getTimestamp } from '@/lib/utils';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ImageGenerationHelpers');

/**
 * What a route wants done with a hard failure — auth rejection, rate limit,
 * network error.
 *
 * 'throw' hands it to the route's own error handler, which is the only way a
 * route can answer with something other than 200. 'fallback' serves the
 * placeholder instead, so the player still gets an illustration when the
 * provider is having a bad day.
 */
type HardFailurePolicy = 'throw' | 'fallback';

interface ImageUrlRequest {
  /** The prompt sent to the image model. */
  prompt: string;
  /** Resolved key for this request (player's BYO key); null means serve the placeholder. */
  apiKey: string | null;
  /** Placeholder served whenever real generation doesn't produce an image. */
  fallbackUrl: string;
  /** Logger context name (e.g. 'generate-portrait API'). */
  loggerContext: string;
  onHardFailure: HardFailurePolicy;
}

interface ResolvedImageUrl {
  url: string;
  /** False whenever the URL is the placeholder rather than a real generation. */
  aiGenerated: boolean;
}

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
  /** Resolved key for this request (player's BYO key). */
  apiKey: string | null;
}

/**
 * Build a dicebear URL with optional parameters
 */
function buildDicebearUrl(config: FallbackImageConfig): string {
  const baseUrl = `https://api.dicebear.com/7.x/${config.variant}/svg`;
  const params = new URLSearchParams({ seed: config.seed });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Run the image-generation sequence every image route shares:
 * 1. Check for a key
 * 2. Serve the placeholder if there isn't one
 * 3. Try real generation
 * 4. Serve the placeholder if generation returns null (soft failure)
 *
 * Routes keep their own prompt building and response shape — this owns only
 * the four steps and the logging around them.
 *
 * @throws When generation fails hard and the caller asked for 'throw'
 */
export async function resolveGeneratedImageUrl({
  prompt,
  apiKey,
  fallbackUrl,
  loggerContext,
  onHardFailure,
}: ImageUrlRequest): Promise<ResolvedImageUrl> {
  if (!apiKey) {
    logger.debug(loggerContext, 'No API key configured, using fallback');
    return { url: fallbackUrl, aiGenerated: false };
  }

  try {
    const generatedImage = await generateImageWithGemini(prompt, apiKey);

    if (generatedImage) {
      logger.debug(loggerContext, 'Image generated successfully');
      return { url: generatedImage.url, aiGenerated: true };
    }

    logger.warn(loggerContext, 'Image generation failed, using fallback');
  } catch (error) {
    if (onHardFailure === 'throw') throw error;
    logger.error(loggerContext, 'Image generation failed, using fallback:', error);
  }

  return { url: fallbackUrl, aiGenerated: false };
}

/**
 * The dicebear-backed variant, for routes that answer with a GeneratedImage
 * object under an `image` key.
 *
 * Hard failures are allowed to throw so the route's error handler can return a
 * proper 500.
 *
 * @param config - Configuration for image generation
 * @returns NextResponse with image data
 * @throws When Gemini API encounters hard failures (auth, network, etc.)
 */
export async function generateImageWithFallback(
  config: ImageGenerationConfig
): Promise<NextResponse> {
  const { url, aiGenerated } = await resolveGeneratedImageUrl({
    prompt: config.prompt,
    apiKey: config.apiKey,
    fallbackUrl: buildDicebearUrl(config.fallback),
    loggerContext: config.loggerContext,
    onHardFailure: 'throw',
  });

  return NextResponse.json({
    image: {
      type: aiGenerated ? 'ai-generated' : config.fallback.imageType ?? 'placeholder',
      url,
      generatedAt: getTimestamp(),
      prompt: config.prompt,
    },
  });
}
