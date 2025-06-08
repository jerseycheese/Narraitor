// src/lib/ai/geminiClient.ts

import { GoogleGenAI } from '@google/genai';
import { AIResponse, AIServiceConfig, AIClient } from './types';
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
}

// Create default client instance
export const geminiClient = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY || '',
  modelName: 'gemini-1.5-pro',
  maxRetries: 3,
  timeout: 30000 // 30 seconds
});
