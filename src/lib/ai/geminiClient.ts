// src/lib/ai/geminiClient.ts

import { GoogleGenAI } from '@google/genai';
import { AIResponse, AIServiceConfig, AIClient, AIImageResponse } from './types';
import { isRetryableError } from './errors';
import { getGenerationConfig, getSafetySettings } from './config';

/**
 * Client for Google Gemini AI service
 * Using the new @google/genai SDK
 */
export class GeminiClient implements AIClient {
  protected config: AIServiceConfig;
  private genAI: GoogleGenAI;
  
  constructor(config: AIServiceConfig) {
    this.config = {
      ...config,
      generationConfig: config.generationConfig || getGenerationConfig(),
      safetySettings: config.safetySettings || getSafetySettings()
    };
    
    // Initialize Google Generative AI with new SDK pattern
    this.genAI = new GoogleGenAI({ apiKey: this.config.apiKey });
  }

  /**
   * Generates content using the AI service
   * @param prompt - The prompt to send
   * @returns Promise resolving to AI response
   */
  async generateContent(prompt: string): Promise<AIResponse> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.config.maxRetries) {
      try {
        const response = await this.makeRequest(prompt);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;

        if (!isRetryableError(lastError) || attempts >= this.config.maxRetries) {
          break;
        }

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempts - 1))
        );
      }
    }

    throw lastError || new Error('Failed to generate content');
  }

  /**
   * Makes the actual API request using Google Generative AI SDK
   * @param prompt - The prompt to send
   * @returns Promise resolving to AI response
   */
  private async makeRequest(prompt: string): Promise<AIResponse> {
    try {
      // Log request for debugging (consider using configurable logger for production)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 GEMINI API: Making request with prompt length:', prompt.length);
      }
      const response = await this.genAI.models.generateContent({
        model: this.config.modelName,
        contents: prompt,
        config: {
          generationConfig: this.config.generationConfig,
          safetySettings: this.config.safetySettings
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 GEMINI API: Response received, content length:', response.text?.length || 0);
      }
      return {
        content: response.text || '',
        finishReason: response.result?.finishReason || 'STOP',
        promptTokens: undefined,
        completionTokens: undefined
      };
    } catch (error) {
      console.error('🔥 GEMINI API: Request failed:', error);
      throw error;
    }
  }

  /**
   * Generates an image using Gemini's image generation API
   * @param prompt - The prompt to generate an image from
   * @returns Promise resolving to AI image response
   */
  async generateImage(prompt: string): Promise<AIImageResponse> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 GEMINI IMAGE API: Starting image generation with prompt length:', prompt.length);
      }

      // Call Google's Gemini image generation API directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.config.apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              ...this.config.generationConfig,
              responseModalities: ["IMAGE", "TEXT"]
            },
            safetySettings: this.config.safetySettings
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔥 GEMINI IMAGE API: Request failed:', response.status, response.statusText, errorText);
        throw new Error(`Gemini image API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 GEMINI IMAGE API: Response received');
      }

      // Extract image from response - same logic as portrait API
      if (!data.candidates?.[0]?.content?.parts) {
        throw new Error('No content in API response');
      }

      // Find the image part in the response
      type ContentPart = { text?: string; inlineData?: { mimeType?: string; data?: string } };
      const parts = data.candidates[0].content.parts as ContentPart[];
      const imagePart = parts.find((part) => 
        part.inlineData && 
        part.inlineData.mimeType && 
        part.inlineData.mimeType.startsWith('image/')
      );
      
      if (!imagePart || !imagePart.inlineData?.data) {
        console.error('🔥 GEMINI IMAGE API: No image part found in response:', {
          partsCount: parts.length,
          parts: parts.map(p => ({ hasText: !!p.text, hasInlineData: !!p.inlineData }))
        });
        throw new Error('No image generated in response');
      }

      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      const base64Data = imagePart.inlineData.data;
      const imageUrl = `data:${mimeType};base64,${base64Data}`;

      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 GEMINI IMAGE API: Successfully generated image, size:', base64Data.length, 'bytes');
      }

      return {
        image: imageUrl,
        prompt: prompt
      };
    } catch (error) {
      console.error('🔥 GEMINI IMAGE API: Image generation failed:', error);
      throw error;
    }
  }
}
