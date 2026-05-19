/**
 * Tests for EndingGenerator - Advanced Features
 *
 * Verifies play time calculation, custom prompts, and ending type variations.
 */

// Mock modules
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

import { generateEnding } from '../endingGenerator';
import { buildEndingContext } from '../contextManager';
import type { EndingGenerationRequest } from '../../../types/narrative.types';
import {
  mockGeminiClient,
  createMockWorld,
  createMockCharacter,
  createMockNarrativeSegments,
  createMockJournalEntries,
  setupTestTimers,
  cleanupTestTimers
} from './endingGenerator.testHelpers';

jest.mock('../defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => mockGeminiClient
}));

const mockBuildEndingContext = buildEndingContext as jest.Mock;

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

jest.mock('../../../state/sessionStore');
jest.mock('../../../state/journalStore');

describe('EndingGenerator - Advanced Features', () => {
  const mockWorld = createMockWorld();
  const mockCharacter = createMockCharacter();
  const mockNarrativeSegments = createMockNarrativeSegments();
  const mockJournalEntries = createMockJournalEntries();

  beforeEach(() => {
    jest.clearAllMocks();
    setupTestTimers();
  });

  afterEach(() => {
    cleanupTestTimers();
  });

  it('should calculate play time when session data is available', async () => {
    const mockRequest: EndingGenerationRequest = {
      sessionId: 'session-789',
      characterId: 'char-456',
      worldId: 'world-123',
      endingType: 'player-choice'
    };

    // Set time to 1 hour ago for session start
    jest.setSystemTime(new Date('2025-01-15T11:00:00Z'));
    const sessionStartTime = new Date();

    // Reset to "now" for the ending generation
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    const mockContext = {
      world: mockWorld,
      character: mockCharacter,
      narrativeSegments: mockNarrativeSegments,
      journalEntries: mockJournalEntries,
      sessionStartTime
    };

    const mockResponse = `{
      "epilogue": "The journey ends...",
      "characterLegacy": "A true hero...",
      "worldImpact": "Forever changed...",
      "tone": "triumphant",
      "achievements": ["Quick Victory"]
    }`;

    mockBuildEndingContext.mockResolvedValue(mockContext);
    mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

    const result = await generateEnding(mockRequest);

    expect(result.playTime).toBeGreaterThan(3500); // Close to 1 hour in seconds
    expect(result.playTime).toBeLessThan(3700);
  });

  it('should include custom prompt when provided', async () => {
    const mockRequest: EndingGenerationRequest = {
      sessionId: 'session-789',
      characterId: 'char-456',
      worldId: 'world-123',
      endingType: 'character-retirement',
      customPrompt: 'Make the character retire peacefully to a cottage'
    };

    const mockContext = {
      world: mockWorld,
      character: mockCharacter,
      narrativeSegments: mockNarrativeSegments,
      journalEntries: []
    };

    mockBuildEndingContext.mockResolvedValue(mockContext);
    mockGeminiClient.generateContent.mockImplementation((prompt) => {
      expect(prompt).toContain('cottage');
      return Promise.resolve({ content: `{
        "epilogue": "Aria retired to a peaceful cottage...",
        "characterLegacy": "Known for choosing peace over glory...",
        "worldImpact": "Inspired others to seek peaceful lives...",
        "tone": "hopeful",
        "achievements": ["Peaceful Retirement"]
      }` });
    });

    await generateEnding(mockRequest);

    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
  });

  it('should generate appropriate endings for each ending type', async () => {
    const endingTypes: Array<{ type: EndingGenerationRequest['endingType'], expectedContent: string }> = [
      { type: 'player-choice', expectedContent: 'chose to end' },
      { type: 'story-complete', expectedContent: 'quest complete' },
      { type: 'session-limit', expectedContent: 'rest for now' },
      { type: 'character-retirement', expectedContent: 'retired' }
    ];

    for (const { type, expectedContent } of endingTypes) {
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-789',
        characterId: 'char-456',
        worldId: 'world-123',
        endingType: type
      };

      const mockContext = {
        world: mockWorld,
        character: mockCharacter,
        narrativeSegments: mockNarrativeSegments,
        journalEntries: []
      };

      mockBuildEndingContext.mockResolvedValue(mockContext);
      mockGeminiClient.generateContent.mockResolvedValue({ content: `{
        "epilogue": "The hero ${expectedContent}...",
        "characterLegacy": "Remembered well...",
        "worldImpact": "Things changed...",
        "tone": "hopeful",
        "achievements": ["Completed"]
      }` });

      const result = await generateEnding(mockRequest);

      expect(result.epilogue).toContain(expectedContent);
    }
  });
});
