// src/lib/ai/__tests__/aiPromptProcessor.test.ts

import { AIPromptProcessor } from '../aiPromptProcessor';
import { ResponseFormatter } from '../responseFormatter';
import { PromptTemplateManager } from '../../promptTemplates/promptTemplateManager';
import { GeminiClient } from '../geminiClient';
import { AIConfig, AIResponse } from '../types';

// Mock dependencies
jest.mock('../../promptTemplates/promptTemplateManager');
jest.mock('../geminiClient', () => ({
  GeminiClient: jest.fn().mockImplementation(() => ({
    generateContent: jest.fn()
  }))
}));
jest.mock('../responseFormatter', () => ({
  ResponseFormatter: jest.fn().mockImplementation(() => ({
    format: jest.fn(),
    getFormattingOptionsForTemplate: jest.fn()
  }))
}));

describe('AIPromptProcessor with formatting', () => {
  let processor: AIPromptProcessor;
  let mockTemplateManager: jest.Mocked<PromptTemplateManager>;
  let mockClient: jest.Mocked<GeminiClient>;
  let mockFormatter: jest.Mocked<ResponseFormatter>;
  let config: AIConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup config
    config = {
      geminiApiKey: 'test-key',
      modelName: 'test-model',
      maxRetries: 3,
      timeout: 30000
    };

    // Create mocks
    mockTemplateManager = {
      processTemplate: jest.fn()
    } as unknown as jest.Mocked<PromptTemplateManager>;

    mockClient = {
      generateContent: jest.fn()
    } as unknown as jest.Mocked<GeminiClient>;

    mockFormatter = {
      format: jest.fn(),
      getFormattingOptionsForTemplate: jest.fn()
    } as unknown as jest.Mocked<ResponseFormatter>;

    // Mock constructors
    (PromptTemplateManager as jest.Mock).mockImplementation(() => mockTemplateManager);
    (GeminiClient as jest.Mock).mockImplementation(() => mockClient);
    (ResponseFormatter as jest.Mock).mockImplementation(() => mockFormatter);

    processor = new AIPromptProcessor({
      templateManager: mockTemplateManager,
      config
    });
  });

  describe('processAndSend with formatting', () => {
    test('should format narrative responses', async () => {
      // Arrange
      const templateId = 'narrative-scene';
      const variables = { scene: 'tavern', character: 'Kara' };
      const aiResponse: AIResponse = {
        content: 'The tavern was bustling.',
        finishReason: 'STOP'
      };
      const formattedResponse: AIResponse = {
        ...aiResponse,
        formattedContent: 'The tavern was bustling.',
        formattingOptions: { formatDialogue: true, enableItalics: true }
      };

      // Mock behaviors
      mockTemplateManager.processTemplate.mockReturnValue('processed prompt');
      mockClient.generateContent.mockResolvedValue(aiResponse);
      mockFormatter.getFormattingOptionsForTemplate.mockReturnValue({ formatDialogue: true, enableItalics: true });
      mockFormatter.format.mockReturnValue(formattedResponse);

      // Act
      const result = await processor.processAndSend(templateId, variables);

      // Assert
      expect(mockFormatter.getFormattingOptionsForTemplate).toHaveBeenCalledWith(templateId);
      expect(mockFormatter.format).toHaveBeenCalledWith(
        aiResponse,
        { formatDialogue: true, enableItalics: true }
      );
      expect(result.formattedContent).toBe('The tavern was bustling.');
    });

    test('should format dialogue responses differently', async () => {
      // Arrange
      const templateId = 'npc-dialogue';
      const variables = { npc: 'merchant' };
      const aiResponse: AIResponse = {
        content: 'The merchant said, Welcome!',
        finishReason: 'STOP'
      };
      const formattedResponse: AIResponse = {
        ...aiResponse,
        formattedContent: 'The merchant said, "Welcome!"',
        formattingOptions: { formatDialogue: true, enableItalics: false }
      };

      // Mock behaviors
      mockTemplateManager.processTemplate.mockReturnValue('processed prompt');
      mockClient.generateContent.mockResolvedValue(aiResponse);
      mockFormatter.getFormattingOptionsForTemplate.mockReturnValue({ formatDialogue: true, enableItalics: false });
      mockFormatter.format.mockReturnValue(formattedResponse);

      // Act  
      const result = await processor.processAndSend(templateId, variables);

      // Assert
      expect(mockFormatter.format).toHaveBeenCalledWith(
        aiResponse,
        { formatDialogue: true, enableItalics: false }
      );
      expect(result.formattingOptions).toEqual({ formatDialogue: true, enableItalics: false });
    });

    test('should format journal entries', async () => {
      // Arrange
      const templateId = 'journal-entry';
      const variables = { event: 'quest-complete' };
      const aiResponse: AIResponse = {
        content: 'Quest completed successfully.',
        finishReason: 'STOP'
      };

      // Mock behaviors  
      mockTemplateManager.processTemplate.mockReturnValue('processed prompt');
      mockClient.generateContent.mockResolvedValue(aiResponse);
      mockFormatter.getFormattingOptionsForTemplate.mockReturnValue({ enableItalics: true });
      mockFormatter.format.mockReturnValue({
        ...aiResponse,
        formattedContent: 'Quest completed successfully.',
        formattingOptions: { enableItalics: true }
      });

      // Act
      const result = await processor.processAndSend(templateId, variables);

      // Assert
      expect(mockFormatter.format).toHaveBeenCalledWith(
        aiResponse,
        { enableItalics: true }
      );
      expect(result.formattingOptions).toEqual({ enableItalics: true });
    });

    test('should handle formatting errors gracefully', async () => {
      // Arrange
      const templateId = 'test-template';
      const variables = {};
      const aiResponse: AIResponse = {
        content: 'Test content',
        finishReason: 'STOP'
      };

      // Mock behaviors
      mockTemplateManager.processTemplate.mockReturnValue('processed prompt');
      mockClient.generateContent.mockResolvedValue(aiResponse);
      mockFormatter.getFormattingOptionsForTemplate.mockReturnValue({});
      mockFormatter.format.mockImplementation(() => {
        throw new Error('Formatting failed');
      });

      // Act
      const result = await processor.processAndSend(templateId, variables);

      // Assert
      expect(result).toEqual(aiResponse); // Returns unformatted on error
    });
  });
});
