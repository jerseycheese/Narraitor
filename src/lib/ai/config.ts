// src/lib/ai/config.ts

import { AIConfig } from './types';

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
