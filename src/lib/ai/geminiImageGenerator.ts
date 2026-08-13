/**
 * Shared utilities for Gemini image generation
 *
 * Consolidates the common logic for calling Gemini's image generation API
 * and extracting image data from responses. Used by portrait, world, and
 * ending image generation API routes.
 */

import Logger from '@/lib/utils/logger';
import { getAIConfig } from './config';

const logger = new Logger('GeminiImageGenerator');

interface GeminiImagePart {
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
}

export interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiImagePart[];
    };
  }>;
}

export interface GeneratedImage {
  url: string;
  mimeType: string;
  base64Data: string;
}

/**
 * Calls Gemini's image generation API with the given prompt
 *
 * @param prompt - The text prompt for image generation
 * @param apiKey - The Gemini API key
 * @returns The raw API response
 * @throws Error if the API call fails
 */
export async function callGeminiImageAPI(
  prompt: string,
  apiKey: string
): Promise<Response> {
  logger.debug('callGeminiImageAPI', 'Calling Gemini image generation API');

  const response = await fetch(
    // v1, not v1beta: gemini-3.1-flash-image is a v1 (GA) model. imageConfig
    // is still the correct field here — verified against the live API, since
    // Google's docs disagree with themselves (generationConfig.responseFormat
    // is listed as valid but 400s with "Invalid value at
    // generation_config.response_format.image.aspect_ratio" in practice).
    `https://generativelanguage.googleapis.com/v1/models/${getAIConfig().imageModelName}:generateContent`,
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
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      })
    }
  );

  return response;
}

/**
 * Extracts the generated image data from a Gemini API response
 *
 * @param data - The parsed JSON response from Gemini API
 * @returns The extracted image data, or null if no image was found
 */
export function extractImageFromResponse(
  data: GeminiImageResponse
): GeneratedImage | null {
  logger.debug('extractImageFromResponse', 'Extracting image from Gemini response');

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: GeminiImagePart) =>
    part.inlineData &&
    part.inlineData.mimeType &&
    part.inlineData.mimeType.startsWith('image/')
  );

  if (!imagePart || !imagePart.inlineData) {
    logger.warn('extractImageFromResponse', 'No image found in API response');
    return null;
  }

  const mimeType = imagePart.inlineData.mimeType!;
  const base64Data = imagePart.inlineData.data!;

  return {
    url: `data:${mimeType};base64,${base64Data}`,
    mimeType,
    base64Data
  };
}

/**
 * High-level function to generate an image using Gemini.
 * Combines API call and image extraction into one operation and returns a
 * base64 data URL. The image is persisted by the caller (e.g. into a store /
 * IndexedDB) rather than written to disk, so it survives serverless instance
 * recycling. Used by the journal, portrait, ending, and world image routes.
 *
 * @param prompt - The text prompt for image generation
 * @param apiKey - The Gemini API key
 * @returns The generated image data, or null if generation failed
 */
export async function generateImageWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeneratedImage | null> {
  try {
    const response = await callGeminiImageAPI(prompt, apiKey);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('generateImageWithGemini', 'Gemini API Error:', errorText);
      return null;
    }

    // Parse the body separately so a malformed/non-JSON success response is
    // distinguishable from a network failure in the logs, rather than being
    // collapsed into the same silent null by the outer catch.
    let data: GeminiImageResponse;
    try {
      data = await response.json();
    } catch (parseError) {
      logger.error(
        'generateImageWithGemini',
        'Failed to parse Gemini response as JSON:',
        parseError
      );
      return null;
    }

    return extractImageFromResponse(data);

  } catch (error) {
    logger.error('generateImageWithGemini', 'Image generation failed:', error);
    return null;
  }
}
