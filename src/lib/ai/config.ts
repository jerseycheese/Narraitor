// src/lib/ai/config.ts

import { AIConfig, GenerationConfig, SafetySetting } from './types';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '@/lib/constants/aiTimeouts';

/**
 * Text model used when the player has not configured one of their own. Every
 * fallback path resolves here, so the default lives in exactly one place.
 */
export const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';

/**
 * Gets AI configuration from environment variables.
 * A missing key falls back to '' here rather than throwing, because config is
 * also read in mock/test contexts; callers that make real requests validate it
 * (see validateAPIKey in apiHelpers and the MOCK_API_KEY sentinel).
 * @returns Configuration object
 */
export const getAIConfig = (): AIConfig => {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    modelName: DEFAULT_TEXT_MODEL,
    imageModelName: 'gemini-2.5-flash-image',
    maxRetries: 3,
    timeout: GEMINI_ATTEMPT_TIMEOUT_MS
  };
};

/**
 * Gets generation configuration for AI model
 * @returns Generation configuration
 */
export const getGenerationConfig = (): GenerationConfig => {
  return {
    temperature: 0.7,
    topP: 1.0,
    topK: 40,
    maxOutputTokens: 2048,
    // gemini-2.5-flash does dynamic "thinking" by default, which burns latency
    // and output-token budget on these interactive game requests. Disable it.
    thinkingConfig: { thinkingBudget: 0 }
  };
};

/**
 * Gets safety settings for AI model
 * @returns Safety settings array
 */
export const getSafetySettings = (): SafetySetting[] => {
  return [
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
  ];
};

/**
 * Gets default configuration for AI service.
 * @param apiKeyOverride - the player's bring-your-own key for this request; when
 *   omitted, falls back to the server env key (today's behavior).
 * @returns Complete AI service configuration
 */
export const getDefaultConfig = (apiKeyOverride?: string | null) => {
  const aiConfig = getAIConfig();
  return {
    // The player's resolved key (passed by the route) -> server env key.
    apiKey: apiKeyOverride ?? aiConfig.geminiApiKey,
    modelName: aiConfig.modelName,
    maxRetries: aiConfig.maxRetries,
    timeout: aiConfig.timeout,
    generationConfig: getGenerationConfig(),
    safetySettings: getSafetySettings()
  };
};
