/**
 * Shared utilities for Gemini image generation
 *
 * Consolidates the common logic for calling Gemini's image generation API
 * and extracting image data from responses. Used by portrait, world, and
 * ending image generation API routes.
 */

import Logger from '@/lib/utils/logger';

const logger = new Logger('GeminiImageGenerator');

export interface GeminiImagePart {
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
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
          outputOptions: {
            aspectRatio: "3:1"
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
 * High-level function to generate an image using Gemini
 * Combines API call and image extraction into one operation
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

    const data = await response.json();
    return extractImageFromResponse(data);

  } catch (error) {
    logger.error('generateImageWithGemini', 'Image generation failed:', error);
    return null;
  }
}
