// src/lib/ai/config.ts

import { AIConfig, GenerationConfig, SafetySetting } from './types';

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
    modelName: 'gemini-2.0-flash',
    imageModelName: 'gemini-2.5-flash-image',
    maxRetries: 3,
    timeout: 30000
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
    maxOutputTokens: 2048
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
 * Gets default configuration for AI service
 * @returns Complete AI service configuration
 */
export const getDefaultConfig = () => {
  const aiConfig = getAIConfig();
  return {
    apiKey: aiConfig.geminiApiKey,
    modelName: aiConfig.modelName,
    maxRetries: aiConfig.maxRetries,
    timeout: aiConfig.timeout,
    generationConfig: getGenerationConfig(),
    safetySettings: getSafetySettings()
  };
};
