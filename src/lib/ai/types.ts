// src/lib/ai/types.ts

import { FormattingOptions } from '../utils/textFormatter';

/**
 * Configuration interface for AI service
 */
export interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
}

/**
 * Standard error object for AI service
 */
export interface AIServiceError {
  code: string;
  message: string;
  retryable: boolean;
}

/**
 * Response from AI service
 */
export interface AIResponse {
  content: string;
  finishReason: string;
  promptTokens?: number;
  completionTokens?: number;
  formattedContent?: string;
  formattingOptions?: FormattingOptions;
}

/**
 * Generation configuration for AI model
 */
export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

/**
 * Safety settings for AI model
 */
export interface SafetySetting {
  category: string;
  threshold: string;
}

/**
 * Processed prompt ready for AI service
 */
export interface ProcessedPrompt {
  content: string;
  templateId: string;
  variables: Record<string, string>;
}

/**
 * Configuration interface for AI integration
 */
export interface AIConfig {
  geminiApiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
}

/**
 * Options for AIPromptProcessor
 */
export interface AIPromptProcessorOptions {
  templateManager: import('../promptTemplates/promptTemplateManager').PromptTemplateManager;
  config: AIConfig;
}

/**
 * Response from AI image generation
 */
export interface AIImageResponse {
  image: string; // Base64 encoded image data
  prompt: string;
}

/**
 * Interface for AI clients (both real and mock)
 */
export interface AIClient {
  generateContent(prompt: string): Promise<AIResponse>;
  generateImage?(prompt: string): Promise<AIImageResponse>;
  generateStructuredContent?(prompt: string, schema: any): Promise<any>;
  isAvailable?(): Promise<boolean>;
}
