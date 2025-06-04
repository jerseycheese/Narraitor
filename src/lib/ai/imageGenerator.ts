// Real AI image generation using OpenAI DALL-E 3
// This is a separate module to handle different image generation services

import Logger from '@/lib/utils/logger';

const logger = new Logger('ImageGenerator');

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

/**
 * Generate an image using OpenAI DALL-E 3
 * Requires OPENAI_API_KEY environment variable
 */
export async function generateImageWithDALLE(options: ImageGenerationOptions): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for image generation');
  }

  logger.debug('generateImageWithDALLE', 'Generating image with prompt:', options.prompt);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: options.prompt,
        n: 1,
        quality: options.quality || 'hd',
        size: options.size || '1792x1024', // Landscape format for world images
        style: options.style || 'vivid',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DALL-E API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No image generated from DALL-E API');
    }

    const imageData = data.data[0];
    logger.debug('generateImageWithDALLE', 'Image generated successfully:', imageData.url);

    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt,
    };

  } catch (error) {
    logger.error('generateImageWithDALLE', 'Image generation failed:', error);
    throw error;
  }
}

/**
 * Generate an image using Replicate (Stable Diffusion or other models)
 * Requires REPLICATE_API_TOKEN environment variable
 */
export async function generateImageWithReplicate(options: ImageGenerationOptions): Promise<GeneratedImage> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN environment variable is required for image generation');
  }

  logger.debug('generateImageWithReplicate', 'Generating image with prompt:', options.prompt);

  try {
    // Using Stable Diffusion XL model on Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e93', // SDXL model
        input: {
          prompt: options.prompt,
          width: 1024,
          height: 768,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 50,
          guidance_scale: 7.5,
          prompt_strength: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Replicate API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }

    const prediction = await response.json();
    
    // Replicate is async, so we need to poll for completion
    const imageUrl = await pollReplicatePrediction(prediction.id, apiToken);
    
    logger.debug('generateImageWithReplicate', 'Image generated successfully:', imageUrl);

    return {
      url: imageUrl,
    };

  } catch (error) {
    logger.error('generateImageWithReplicate', 'Image generation failed:', error);
    throw error;
  }
}

/**
 * Poll Replicate prediction until completion
 */
async function pollReplicatePrediction(predictionId: string, apiToken: string, maxAttempts = 30): Promise<string> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.status}`);
    }

    const prediction = await response.json();
    
    if (prediction.status === 'succeeded') {
      if (prediction.output && prediction.output.length > 0) {
        return prediction.output[0];
      }
      throw new Error('Prediction succeeded but no output received');
    }
    
    if (prediction.status === 'failed') {
      throw new Error(`Image generation failed: ${prediction.error || 'Unknown error'}`);
    }
    
    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Image generation timed out');
}

/**
 * Main image generation function that tries different services
 */
export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
  // Try DALL-E 3 first if API key is available
  if (process.env.OPENAI_API_KEY) {
    try {
      logger.debug('generateImage', 'Attempting DALL-E 3 generation');
      return await generateImageWithDALLE(options);
    } catch (error) {
      logger.error('generateImage', 'DALL-E 3 failed, trying fallback:', error);
    }
  }
  
  // Try Replicate as fallback if API token is available
  if (process.env.REPLICATE_API_TOKEN) {
    try {
      logger.debug('generateImage', 'Attempting Replicate generation');
      return await generateImageWithReplicate(options);
    } catch (error) {
      logger.error('generateImage', 'Replicate failed:', error);
    }
  }
  
  // If no API keys available or all services failed
  throw new Error('No image generation service available. Please configure OPENAI_API_KEY or REPLICATE_API_TOKEN environment variables.');
}
