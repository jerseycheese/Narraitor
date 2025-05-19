import { GeminiClient } from './geminiClient';
import { getDefaultConfig } from './config';

// Create a default instance of GeminiClient for narrative generation
export const createDefaultGeminiClient = () => {
  return new GeminiClient(getDefaultConfig());
};