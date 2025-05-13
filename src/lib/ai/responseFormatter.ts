// src/lib/ai/responseFormatter.ts

import { formatAIResponse, FormattingOptions } from '../utils/textFormatter';
import { AIResponse } from './types';

/**
 * Formats AI responses using the text formatting utility
 * Applies different formatting options based on content type
 */
export class ResponseFormatter {
  /**
   * Formats an AI response with appropriate formatting options
   * @param response - The AI response to format
   * @param options - Optional formatting options to override defaults
   * @returns The formatted AI response with both raw and formatted content
   */
  format(response: AIResponse, options?: FormattingOptions): AIResponse {
    try {
      // Handle null/undefined content gracefully
      const content = response.content ?? '';
      
      // Apply formatting using the utility
      const formattedContent = formatAIResponse(content, options || {});
      
      // Return response with formatted content
      return {
        ...response,
        formattedContent,
        formattingOptions: options
      };
    } catch {
      // On formatting error, return original response unchanged
      return response;
    }
  }

  /**
   * Gets default formatting options based on template type
   * @param templateType - The type of template being used
   * @returns Appropriate formatting options for the template type
   */
  getFormattingOptionsForTemplate(templateType: string): FormattingOptions {
    switch (templateType) {
      case 'narrative':
      case 'narrative-scene':
        return {
          formatDialogue: true,
          enableItalics: true
        };
      
      case 'dialogue':
      case 'npc-dialogue':
        return {
          formatDialogue: true,
          enableItalics: false
        };
      
      case 'journal':
      case 'journal-entry':
        return {
          formatDialogue: false,
          enableItalics: true
        };
      
      default:
        return {};
    }
  }
}
