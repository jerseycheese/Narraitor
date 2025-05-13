import { AIPromptProcessor } from '../../aiPromptProcessor';
import { PromptTemplateManager } from '../../../promptTemplates/promptTemplateManager';
import { PromptContextManager } from '../../../promptContext/promptContextManager';
import { createMockResponse } from '../../__mocks__/mockUtils';
import { createMockWorld, createMockCharacter } from '../../../promptContext/__tests__/test-helpers';
import { PromptType } from '../../../promptTemplates/types';
import { GeminiClient } from '../../geminiClient';

jest.mock('../../geminiClient');

describe('Context with AI End-to-End', () => {
  let aiProcessor: AIPromptProcessor;
  let templateManager: PromptTemplateManager;
  let contextManager: PromptContextManager;
  let mockGeminiClient: {
    generateContent: jest.MockedFunction<typeof GeminiClient.prototype.generateContent>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    templateManager = new PromptTemplateManager();
    contextManager = new PromptContextManager();

    mockGeminiClient = {
      generateContent: jest.fn()
    };

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

  test('should complete full flow from context generation to AI response', async () => {
    const mockWorld = createMockWorld();
    const mockCharacter = createMockCharacter();

    const template = {
      id: 'e2e-test',
      type: PromptType.NARRATIVE,
      content: 'World: {{context}}\n\nCreate a story for {{characterName}}.',
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

    const mockResponse = createMockResponse({
      content: `${mockCharacter.name} begins their journey in ${mockWorld.name}...`,
      promptTokens: contextResult.finalTokenCount + 50,
      completionTokens: 150
    });

    mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);

    const result = await aiProcessor.processAndSend('e2e-test', {
      context: contextResult.context,
      characterName: mockCharacter.name! // Add non-null assertion
    });

    expect(result.content).toContain(mockCharacter.name);
    expect(result.content).toContain(mockWorld.name);
    expect(result.promptTokens).toBe(contextResult.finalTokenCount + 50);
  });

  test('should handle complex nested context structures', async () => {
    // Cast to appropriate types after adding properties in test-helpers.ts
    const mockWorld = createMockWorld();
    const mockCharacter = createMockCharacter();

    // Add nested data to test complex structures
    mockWorld.lore = [
      { content: 'Ancient history of the realm' },
      { content: 'The great war of ages past' }
    ];

    mockCharacter.knownPeople = [
      { name: 'Ally', description: 'Trusted companion' }
    ];

    const template = {
      id: 'complex-context',
      type: PromptType.DIALOGUE,
      content: '{{context}}\n\nGenerate dialogue for {{characterName}}.',
      variables: [
        { name: 'context', description: 'Full context' },
        { name: 'characterName', description: 'Character' }
      ]
    };

    templateManager.addTemplate(template);

    const contextResult = await contextManager.generateContext({
      world: mockWorld,
      character: mockCharacter,
      tokenLimit: 2000
    });

    const mockResponse = createMockResponse({
      content: 'Complex dialogue response'
    });

    mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);

    await aiProcessor.processAndSend('complex-context', {
      context: contextResult.context,
      characterName: mockCharacter.name! // Add non-null assertion
    });

    expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining(contextResult.context)
    );
  });
});
