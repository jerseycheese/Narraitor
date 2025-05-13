// src/lib/ai/__mocks__/responseFormatter.ts

import { FormattingOptions } from '../../utils/textFormatter';
import { AIResponse } from '../types';

export class ResponseFormatter {
  format = jest.fn((response: AIResponse, options?: FormattingOptions): AIResponse => {
    return {
      ...response,
      formattedContent: response.content,
      formattingOptions: options
    };
  });

  getFormattingOptionsForTemplate = jest.fn((templateType: string): FormattingOptions => {
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
  });
}
