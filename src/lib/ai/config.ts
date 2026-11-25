// src/lib/ai/config.ts

import { AIConfig, GenerationConfig, SafetySetting } from './types';
import { getThinkingConfig } from './thinkingConfig';
import { AI_ATTEMPT_TIMEOUT_MS } from '@/lib/constants/aiTimeouts';

/**
 * Default model for an explicitly selected Gemini provider. Other providers
 * carry their own model in the resolved request descriptor.
 */
export const DEFAULT_TEXT_MODEL = 'gemini-3.6-flash';

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
    imageModelName: 'gemini-3.1-flash-image',
    maxRetries: 3,
    timeout: AI_ATTEMPT_TIMEOUT_MS
  };
};

/**
 * Gets generation configuration for AI model
 * @param model - the model the request runs on; thinking settings differ by model
 * @returns Generation configuration
 */
export const getGenerationConfig = (
  model: string = DEFAULT_TEXT_MODEL
): GenerationConfig => {
  return {
    temperature: 0.7,
    topP: 1.0,
    topK: 40,
    maxOutputTokens: 2048,
    thinkingConfig: getThinkingConfig(model)
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
 * The Gemini key a caller should actually use.
 *
 * Text requests require an explicit player key; absent credentials stay empty.
 */
export const resolveEffectiveGeminiKey = (requestKey?: string | null): string =>
  requestKey ?? '';

/**
 * Gets default configuration for AI service.
 * @param apiKeyOverride - the player's bring-your-own key for this request; when
 *   omitted, no key is configured.
 * @param modelOverride - the model the player picked (see resolveProvider); when
 *   omitted, falls back to the default text model.
 * @returns Complete AI service configuration
 */
export const getDefaultConfig = (
  apiKeyOverride?: string | null,
  modelOverride?: string | null
) => {
  const aiConfig = getAIConfig();
  const modelName = modelOverride ?? aiConfig.modelName;
  return {
    apiKey: resolveEffectiveGeminiKey(apiKeyOverride),
    modelName,
    maxRetries: aiConfig.maxRetries,
    timeout: aiConfig.timeout,
    generationConfig: getGenerationConfig(modelName),
    safetySettings: getSafetySettings()
  };
};
