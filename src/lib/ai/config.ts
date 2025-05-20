// src/lib/ai/config.ts

import { AIConfig, GenerationConfig, SafetySetting } from './types';

/**
 * Gets AI configuration from environment variables
 * Following the pattern from Boot Hill project
 * @returns Configuration object
 */
export const getAIConfig = (): AIConfig => {
  return {
    geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    modelName: 'gemini-2.0-flash',
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
