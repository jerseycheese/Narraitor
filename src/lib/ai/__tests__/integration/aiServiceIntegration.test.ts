import { GeminiClient } from '../../geminiClient';
import { createMockResponse } from '../../__mocks__/mockUtils';
import { createMockWorld, createMockCharacter } from '../../../promptContext/__tests__/test-helpers';
import { PromptContextManager } from '../../../promptContext/promptContextManager';
import { AIResponse } from '../../types';

jest.mock('../../geminiClient');

describe('AI Service Integration with Context', () => {
  let mockGeminiClient: {
    generateContent: jest.MockedFunction<(prompt: string) => Promise<AIResponse>>;
  };
  let contextManager: PromptContextManager;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGeminiClient = {
      generateContent: jest.fn()
    };

    (GeminiClient as jest.MockedClass<typeof GeminiClient>).mockImplementation(() => mockGeminiClient as unknown as GeminiClient);

    contextManager = new PromptContextManager();
  });

  test('should pass context to AI service correctly', async () => {
    const mockWorld = createMockWorld();
    const mockCharacter = createMockCharacter();

    const contextResult = await contextManager.generateContext({
      world: mockWorld,
      character: mockCharacter,
      tokenLimit: 1000
    });

    const mockResponse = createMockResponse({
      content: 'AI response with context'
    });

    mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);

    const geminiClient = new GeminiClient({ apiKey: 'test-key', modelName: 'gemini-pro', maxRetries: 3, timeout: 10000 });
    const result = await geminiClient.generateContent(contextResult.context);

    expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(contextResult.context);
    expect(result.content).toBe('AI response with context');
  });

  test('should handle edge cases with null/missing data', async () => {
    const contextResult = await contextManager.generateContext({
      world: null,
      character: null,
      tokenLimit: 1000
    });

    const mockResponse = createMockResponse({
      content: 'Handled missing data'
    });

    mockGeminiClient.generateContent.mockResolvedValueOnce(mockResponse);

    const geminiClient = new GeminiClient({ apiKey: 'test-key', modelName: 'gemini-pro', maxRetries: 3, timeout: 10000 });
    const result = await geminiClient.generateContent(contextResult.context);

    expect(result.content).toBe('Handled missing data');
  });
});
