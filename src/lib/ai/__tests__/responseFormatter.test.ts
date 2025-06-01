// src/lib/ai/__tests__/responseFormatter.test.ts

import { ResponseFormatter } from '../responseFormatter';
import { formatAIResponse, FormattingOptions } from '../../utils/textFormatter';
import { AIResponse } from '../types';

// Mock the text formatter utility
jest.mock('../../utils/textFormatter');

describe('ResponseFormatter', () => {
  let formatter: ResponseFormatter;
  const mockFormatAIResponse = formatAIResponse as jest.MockedFunction<typeof formatAIResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    formatter = new ResponseFormatter();
  });

  describe('format method', () => {
    test('should format AI response content', () => {
      // Arrange
      const response: AIResponse = {
        content: 'Test content',
        finishReason: 'STOP'
      };
      mockFormatAIResponse.mockReturnValue('Formatted content');

      // Act
      const result = formatter.format(response);

      // Assert
      expect(mockFormatAIResponse).toHaveBeenCalledWith('Test content', {});
      expect(result.formattedContent).toBe('Formatted content');
      expect(result.content).toBe('Test content'); // Original preserved
    });

    test('should apply custom formatting options', () => {
      // Arrange
      const response: AIResponse = {
        content: 'Test dialogue',
        finishReason: 'STOP'
      };
      const options: FormattingOptions = {
        formatDialogue: true,
        enableItalics: true
      };
      mockFormatAIResponse.mockReturnValue('Formatted dialogue');

      // Act
      const result = formatter.format(response, options);

      // Assert
      expect(mockFormatAIResponse).toHaveBeenCalledWith('Test dialogue', options);
      expect(result.formattedContent).toBe('Formatted dialogue');
      expect(result.formattingOptions).toEqual(options);
    });

    test('should handle empty content', () => {
      // Arrange
      const response: AIResponse = {
        content: '',
        finishReason: 'STOP'
      };
      mockFormatAIResponse.mockReturnValue('');

      // Act
      const result = formatter.format(response);

      // Assert
      expect(result.formattedContent).toBe('');
      expect(result.content).toBe('');
    });


    test('should preserve existing response properties', () => {
      // Arrange
      const response: AIResponse = {
        content: 'Test',
        finishReason: 'MAX_TOKENS',
        promptTokens: 100,
        completionTokens: 200
      };
      mockFormatAIResponse.mockReturnValue('Formatted');

      // Act
      const result = formatter.format(response);

      // Assert
      expect(result.promptTokens).toBe(100);
      expect(result.completionTokens).toBe(200);
      expect(result.finishReason).toBe('MAX_TOKENS');
    });
  });
});
