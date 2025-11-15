/**
 * Tests for EndingGenerator - Error Handling and Retry
 *
 * Verifies error handling and retry logic for failed generation attempts.
 */

// Mock modules that have dependency issues first
jest.mock('../../../state/sessionStore', () => ({
  useSessionStore: {
    getState: jest.fn().mockReturnValue({
      currentSessionId: 'test-session',
      sessionId: 'test-session'
    })
  }
}));

jest.mock('../../../state/journalStore', () => ({
  useJournalStore: {
    getState: jest.fn().mockReturnValue({
      entries: []
    })
  }
}));

import { endingGenerator } from '../endingGenerator';
import { buildEndingContext } from '../contextManager';
import { promptTemplateManager } from '../../promptTemplates/promptTemplateManager';
import type { EndingGenerationRequest } from '../../../types/narrative.types';
import { PromptType } from '../../promptTemplates/types';
import {
  mockGeminiClient,
  createMockWorld,
  createMockCharacter,
  createMockNarrativeSegments,
  setupTestTimers,
  cleanupTestTimers
} from './endingGenerator.testHelpers';

// Mock createDefaultGeminiClient to return our mocked client
jest.mock('../defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => mockGeminiClient
}));

const mockBuildEndingContext = buildEndingContext as jest.Mock;

// Mock logger
jest.mock('../../utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  };

  class MockLogger {
    constructor() {
      Object.assign(this, mockLogger);
    }

    debug = mockLogger.debug;
    error = mockLogger.error;
    warn = mockLogger.warn;
    info = mockLogger.info;
  }

  return {
    logger: mockLogger,
    Logger: MockLogger,
    default: MockLogger
  };
});

jest.mock('../geminiClient', () => ({
  geminiClient: {
    generateContent: jest.fn(),
    getLastTokenUsage: jest.fn().mockReturnValue({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150
    })
  }
}));

jest.mock('../contextManager', () => ({
  buildEndingContext: jest.fn()
}));

jest.mock('../../promptTemplates/promptTemplateManager', () => ({
  promptTemplateManager: {
    getTemplate: jest.fn(),
    addTemplate: jest.fn()
  }
}));

jest.mock('../../../state/sessionStore');
jest.mock('../../../state/journalStore');

describe('EndingGenerator - Error Handling and Retry', () => {
  const mockWorld = createMockWorld();
  const mockCharacter = createMockCharacter();
  const mockNarrativeSegments = createMockNarrativeSegments();

  beforeEach(() => {
    jest.clearAllMocks();
    setupTestTimers();
  });

  afterEach(() => {
    cleanupTestTimers();
  });

  describe('Error Handling', () => {
    it('should handle generation errors gracefully', async () => {
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-789',
        characterId: 'char-456',
        worldId: 'world-123',
        endingType: 'session-limit'
      };

      mockBuildEndingContext.mockRejectedValue(
        new Error('Failed to build context')
      );

      await expect(endingGenerator.generateEnding(mockRequest)).rejects.toThrow(
        'Failed to create ending'
      );
    });
  });

  describe('Retry Generation', () => {
    it('should retry failed generation attempts', async () => {
      // Use real timers for this test since it involves retry delays
      jest.useRealTimers();
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-789',
        characterId: 'char-456',
        worldId: 'world-123',
        endingType: 'story-complete'
      };

      const mockContext = {
        world: mockWorld,
        character: mockCharacter,
        narrativeSegments: mockNarrativeSegments,
        journalEntries: []
      };

      const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;

      mockBuildEndingContext.mockResolvedValue(mockContext);
      mockPromptTemplateManager.getTemplate.mockReturnValue({
        id: 'test-template',
        type: PromptType.NARRATIVE,
        content: 'Compose ending...',
        variables: []
      });

      // First attempt fails, second succeeds
      mockGeminiClient.generateContent
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ content: `{
          "epilogue": "Success after retry...",
          "characterLegacy": "A persistent hero...",
          "worldImpact": "Changed through determination...",
          "tone": "triumphant",
          "achievements": ["Never Give Up"]
        }` });

      const result = await endingGenerator.generateEnding(mockRequest);

      expect(result.epilogue).toContain('Success after retry');
      expect(mockGeminiClient.generateContent).toHaveBeenCalledTimes(2);
    });
  });
});
