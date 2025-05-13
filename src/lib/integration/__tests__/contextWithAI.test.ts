import { PromptContextManager } from '../../promptContext/promptContextManager';
import { AIPromptProcessor } from '../../ai/aiPromptProcessor';
import { PromptTemplateManager } from '../../promptTemplates/promptTemplateManager';
import { createMockWorld, createMockCharacter } from '../../promptContext/__tests__/test-helpers';
import { createMockResponse } from '../../ai/__mocks__/mockUtils';
import { PromptType } from '../../promptTemplates/types';
import { AIResponse } from '../../ai/types';

// Mock the GeminiClient
jest.mock('../../ai/geminiClient');

describe('End-to-End Context with AI Integration', () => {
  let contextManager: PromptContextManager;
  let aiProcessor: AIPromptProcessor;
  let templateManager: PromptTemplateManager;
  let mockGeminiClient: {
    generateContent: jest.MockedFunction<(prompt: string) => Promise<AIResponse>>;
  };

  beforeEach(() => {
    contextManager = new PromptContextManager();
    templateManager = new PromptTemplateManager();
    
    // Create mock client
    mockGeminiClient = {
      generateContent: jest.fn()
    };
    
    // Mock the GeminiClient constructor
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GeminiClient } = require('../../ai/geminiClient');
    GeminiClient.mockImplementation(() => mockGeminiClient);
    
    // Create templates that use context
    const narrativeTemplate = {
      id: 'context-narrative',
      type: PromptType.NARRATIVE,
      content: 'Context: {{context}}\n\nInstruction: Generate a story segment.',
      variables: [
        { name: 'context', description: 'World and character context' }
      ]
    };
    
    const decisionTemplate = {
      id: 'context-decision',
      type: PromptType.NARRATIVE,
      content: 'Context: {{context}}\n\nProvide 3 choices for the player.',
      variables: [
        { name: 'context', description: 'Context for decision making' }
      ]
    };
    
    templateManager.addTemplate(narrativeTemplate);
    templateManager.addTemplate(decisionTemplate);
    
    aiProcessor = new AIPromptProcessor({
      templateManager,
      config: {
        geminiApiKey: 'test-key',
        modelName: 'gemini-pro',
        maxRetries: 3,
        timeout: 30000
      }
    });
  });

  test('should integrate context with narrative generation', async () => {
    // Create test data
    const world = createMockWorld({ genre: 'fantasy', theme: 'medieval' });
    const character = createMockCharacter({ name: 'Sir Lancelot', level: 5 });
    
    // Generate context
    const contextResult = await contextManager.generateContext({
      world,
      character,
      tokenLimit: 1000,
      promptType: 'narrative'
    });
    
    // Mock AI response
    const mockAIResponse = createMockResponse({
      content: 'Sir Lancelot enters the medieval castle...'
    });
    
    mockGeminiClient.generateContent.mockResolvedValueOnce(mockAIResponse);
    
    // Process with context
    const result = await aiProcessor.processAndSend('context-narrative', {
      context: contextResult.context
    });
    
    // Verify integration
    expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Sir Lancelot')
    );
    expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('fantasy')
    );
    expect(result.content).toContain('Sir Lancelot');
  });

  test('should integrate context with decision generation', async () => {
    // Create test data
    const world = createMockWorld();
    const character = createMockCharacter();
    const recentEvents = ['Found a mysterious artifact', 'Met a wise wizard'];
    
    // Generate context for decision
    const contextResult = await contextManager.generateContext({
      world,
      character,
      recentEvents,
      tokenLimit: 800,
      promptType: 'decision'
    });
    
    // Mock AI response with choices
    const mockAIResponse = createMockResponse({
      content: JSON.stringify({
        choices: [
          'Examine the artifact closely',
          'Ask the wizard about the artifact',
          'Continue your journey'
        ]
      })
    });
    
    mockGeminiClient.generateContent.mockResolvedValueOnce(mockAIResponse);
    
    // Process with context
    const result = await aiProcessor.processAndSend('context-decision', {
      context: contextResult.context
    });
    
    // Verify the context included recent events
    expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('mysterious artifact')
    );
    expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('wise wizard')
    );
    
    // Verify we received the result (even if not used)
    expect(result.content).toBeDefined();
  });
});
