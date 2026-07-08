// src/lib/ai/geminiClient.ts

import { GoogleGenAI, type SafetySetting as SdkSafetySetting } from '@google/genai';
import { AIResponse, AIServiceConfig, AIClient, SafetySetting } from './types';
import { isRetryableError } from '@/lib/utils/errorUtils';
import { getGenerationConfig, getSafetySettings } from './config';
import { timeoutSignal } from './abortTimeout';

import Logger from '@/lib/utils/logger';
const logger = new Logger('GeminiClient');

/**
 * Our config carries safety settings as plain strings, because the same values
 * also go out on the raw REST path (see apiHelpers). The SDK types them as its
 * own string enums whose runtime values are exactly these spellings, so this is
 * a re-typing at the boundary, not a conversion.
 */
function toSdkSafetySettings(settings: SafetySetting[] = []): SdkSafetySetting[] {
  return settings.map(({ category, threshold }) => ({
    category: category as SdkSafetySetting['category'],
    threshold: threshold as SdkSafetySetting['threshold']
  }));
}

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
    const { temperature, topP, topK, maxOutputTokens, thinkingConfig } =
      this.config.generationConfig ?? {};

    try {
      const response = await this.genAI.models.generateContent({
        model: this.config.modelName,
        contents: prompt,
        config: {
          // The SDK reads generation params straight off `config` and drops
          // unknown keys without complaint. Nesting them under a
          // `generationConfig` key (the REST wire shape) sends nothing.
          temperature,
          topP,
          topK,
          maxOutputTokens,
          thinkingConfig,
          safetySettings: toSdkSafetySettings(this.config.safetySettings),
          // config.timeout existed but was never enforced — a hung request
          // previously blocked forever (retries only fire on rejection).
          abortSignal: timeoutSignal(this.config.timeout)
        }
      });

      return {
        content: response.text || '',
        finishReason: response.candidates?.[0]?.finishReason || 'STOP',
        promptTokens: response.usageMetadata?.promptTokenCount || undefined,
        completionTokens: response.usageMetadata?.candidatesTokenCount || undefined
      };
    } catch (error) {
      logger.error('GEMINI API: Request failed:', error);
      throw error;
    }
  }
}

