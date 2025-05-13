// src/lib/ai/types.ts

/**
 * Configuration interface for AI service
 */
export interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  maxRetries: number;
  timeout: number;
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
