import { AIPromptProcessor } from '../../aiPromptProcessor';
import { PromptTemplateManager } from '../../../promptTemplates/promptTemplateManager';
import { PromptContextManager } from '../../../promptContext/promptContextManager';
import { createMockResponse } from '../../__mocks__/mockUtils';
import { createMockWorld, createMockCharacter } from '../../../promptContext/__tests__/test-helpers';
import { PromptType } from '../../../promptTemplates/types';
import { AIResponse } from '../../types';
import { GeminiClient } from '../../geminiClient';

// Mock the GeminiClient
jest.mock('../../geminiClient');

describe('AIPromptProcessor with PromptContext Integration', () => {
  let aiProcessor: AIPromptProcessor;
  let templateManager: PromptTemplateManager;
  let contextManager: PromptContextManager;
  let mockGeminiClient: {
    generateContent: jest.MockedFunction<(prompt: string) => Promise<AIResponse>>;
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup instances
    templateManager = new PromptTemplateManager();
    contextManager = new PromptContextManager();
    
    // Create mock client
    mockGeminiClient = {
      generateContent: jest.fn()
    };
    
    // Mock the GeminiClient constructor
    (GeminiClient as jest.MockedClass<typeof GeminiClient>).mockImplementation(() => mockGeminiClient as unknown as GeminiClient);
    
    aiProcessor = new AIPromptProcessor({
      templateManager,
      config: {
        geminiApiKey: 'test-api-key',
        modelName: 'gemini-pro',
        maxRetries: 3,
        timeout: 30000
      }
    });
  });

  describe('Context-aware prompt processing', () => {
    test('should include world and character context in AI prompt', async () => {
      // Test Scenario: Small world with simple character
      const mockWorld = createMockWorld();
      const mockCharacter = createMockCharacter();
      
      // Create a template with context variable
      const narrativeTemplate = {
        id: 'narrative-with-context',
        type: PromptType.NARRATIVE,
        content: '{{context}}\n\nGenerate a narrative based on the above context.',
        variables: [{ name: 'context', description: 'World and character context' }]
      };
      
      templateManager.addTemplate(narrativeTemplate);
      
      // Generate context
      const contextResult = await contextManager.generateContext({
        world: mockWorld,
        character: mockCharacter,
        tokenLimit: 1000
      });
      
      // Mock AI response
      const mockResponse = createMockResponse({
        content: 'A narrative response based on context',
        promptTokens: 500,
        completionTokens: 200
      });
      
      mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);
      
      const result = await aiProcessor.processAndSend('narrative-with-context', {
        context: contextResult.context
      });
      
      // Verify the AI received the context
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining(contextResult.context)
      );
      expect(result.content).toBe('A narrative response based on context');
    });

    test('should monitor token usage with context', async () => {
      // Test: Monitor token usage in production
      const mockWorld = createMockWorld();
      const mockCharacter = createMockCharacter();
      
      const template = {
        id: 'token-test',
        type: PromptType.NARRATIVE,
        content: '{{context}}',
        variables: [{ name: 'context', description: 'Context' }]
      };
      
      templateManager.addTemplate(template);
      
      const contextResult = await contextManager.generateContext({
        world: mockWorld,
        character: mockCharacter,
        tokenLimit: 500
      });
      
      const mockResponse = createMockResponse({
        promptTokens: contextResult.finalTokenCount,
        completionTokens: 100
      });
      
      mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);
      
      const result = await aiProcessor.processAndSend('token-test', {
        context: contextResult.context
      });
      
      // Verify token usage tracking
      expect(result.promptTokens).toBe(contextResult.finalTokenCount);
      expect(result.completionTokens).toBe(100);
    });
  });

  describe('Context quality verification', () => {
    test('should verify AI response quality with context', async () => {
      // Test: Verify AI response quality with context
      const mockWorld = createMockWorld();
      const mockCharacter = createMockCharacter();
      
      const template = {
        id: 'quality-test',
        type: PromptType.NARRATIVE,
        content: '{{context}}\n\nContinue the story for {{characterName}}.',
        variables: [
          { name: 'context', description: 'Context' },
          { name: 'characterName', description: 'Character name' }
        ]
      };
      
      templateManager.addTemplate(template);
      
      const contextResult = await contextManager.generateContext({
        world: mockWorld,
        character: mockCharacter,
        tokenLimit: 1000
      });
      
      // Mock a quality response that references context elements
      const characterName = mockCharacter.name ?? 'Unknown Character';
      const mockResponse = createMockResponse({
        content: `${characterName} explores the ${mockWorld.genre} world...`
      });
      
      mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);
      
      const result = await aiProcessor.processAndSend('quality-test', {
        context: contextResult.context,
        characterName: characterName
      });
      
      // Verify response quality
      expect(result.content).toContain(characterName);
      expect(result.content).toContain(mockWorld.genre);
    });
  });
});
