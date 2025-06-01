// src/lib/ai/aiPromptProcessor.ts

import { PromptTemplateManager } from '../promptTemplates/promptTemplateManager';
import { AIConfig, AIResponse, AIPromptProcessorOptions } from './types';
import { GeminiClient } from './geminiClient';
import { ResponseFormatter } from './responseFormatter';

/**
 * Integration layer between PromptTemplateManager and AI service
 * Processes templates and sends them to the AI service
 */
export class AIPromptProcessor {
  private templateManager: PromptTemplateManager;
  private client: GeminiClient;
  private config: AIConfig;
  private formatter: ResponseFormatter;

  /**
   * Creates a new AIPromptProcessor instance
   * @param options - Configuration options
   * @throws Error if configuration is invalid
   */
  constructor(options: AIPromptProcessorOptions) {
    // Validate configuration
    if (!options.config.geminiApiKey) {
      throw new Error('Invalid configuration: API key is required');
    }

    this.templateManager = options.templateManager;
    this.config = options.config;
    this.client = new GeminiClient({
      apiKey: options.config.geminiApiKey,
      modelName: options.config.modelName,
      maxRetries: options.config.maxRetries,
      timeout: options.config.timeout
    });
    this.formatter = new ResponseFormatter();
  }

  /**
   * Processes a template and sends it to the AI service
   * @param templateId - ID of the template to process
   * @param variables - Variables to substitute in the template
   * @returns Promise resolving to AI response with formatted content
   * @throws Error if template not found or AI service fails
   */
  async processAndSend(templateId: string, variables: Record<string, string>): Promise<AIResponse> {
    // Process the template
    let processedPrompt: string;
    try {
      processedPrompt = this.templateManager.processTemplate(templateId, variables);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error(`Template with id '${templateId}' not found`);
      }
      throw error;
    }

    // Send to AI service
    let response: AIResponse;
    try {
      response = await this.client.generateContent(processedPrompt);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }

    // Apply formatting based on template type
    try {
      const formattingOptions = this.formatter.getFormattingOptionsForTemplate(templateId);
      return this.formatter.format(response, formattingOptions);
    } catch {
      // If formatting fails, return the original response
      return response;
    }
  }
}
