/**
 * Tests for EndingGenerator - Basic Generation
 *
 * Verifies core ending generation with required fields and tone handling.
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

describe('EndingGenerator - Basic Generation', () => {
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

  it('should generate an ending with all required fields', async () => {
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
      journalEntries: mockJournalEntries
    };

    const mockResponse = `{
      "epilogue": "As the sun set over the kingdom, Aria stood victorious...",
      "characterLegacy": "Aria Stormblade would be remembered as the hero who saved the realm...",
      "worldImpact": "The defeat of the dark lord brought peace to the land for generations...",
      "tone": "triumphant",
      "achievements": ["Dragon Slayer", "Savior of the Realm", "Master Warrior"]
    }`;

    mockBuildEndingContext.mockResolvedValue(mockContext);
    mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

    const result = await generateEnding(mockRequest);

    expect(result).toMatchObject({
      epilogue: expect.any(String),
      characterLegacy: expect.any(String),
      worldImpact: expect.any(String),
      tone: 'triumphant',
      achievements: expect.arrayContaining(['Dragon Slayer'])
    });

    expect(mockBuildEndingContext).toHaveBeenCalledWith(mockRequest);
    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
  });

  it('should use desired tone when provided', async () => {
    const mockRequest: EndingGenerationRequest = {
      sessionId: 'session-789',
      characterId: 'char-456',
      worldId: 'world-123',
      endingType: 'player-choice',
      desiredTone: 'triumphant'
    };

    const mockContext = {
      world: mockWorld,
      character: mockCharacter,
      narrativeSegments: mockNarrativeSegments,
      journalEntries: []
    };

    const mockResponse = `{
      "epilogue": "Victory came at a great cost...",
      "characterLegacy": "Aria saved the realm, but lost much along the way...",
      "worldImpact": "Peace was restored, though scars remained...",
      "tone": "triumphant",
      "achievements": ["Pyrrhic Victory", "The Sacrifice"]
    }`;

    mockBuildEndingContext.mockResolvedValue(mockContext);
    mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

    const result = await generateEnding(mockRequest);

    expect(result.tone).toBe('triumphant');
    expect(result.epilogue).toContain('cost');
  });

  it('should include worldClock open threads in rendered prompt when provided', async () => {
    const mockRequest: EndingGenerationRequest = {
      sessionId: 'session-789',
      characterId: 'char-456',
      worldId: 'world-123',
      endingType: 'story-complete',
      worldClock: {
        currentTurn: 30,
        turnsSinceWorldMoved: 3,
        threads: [
          {
            kind: 'actor',
            summary: 'Companion dragged off at turn 7',
            ageTurns: 23,
            overdue: true,
          },
          {
            kind: 'deadline',
            summary: 'Camp kid on dawn deadline',
            ageTurns: 22,
            overdue: false,
          },
        ],
      },
    };

    const mockContext = {
      world: mockWorld,
      character: mockCharacter,
      narrativeSegments: mockNarrativeSegments,
      journalEntries: mockJournalEntries,
    };

    const mockResponse = `{
      "epilogue": "The sun rose on a quiet camp...",
      "characterLegacy": "Remembered forever...",
      "worldImpact": "The camp was never the same...",
      "tone": "hopeful",
      "achievements": ["Survivor"]
    }`;

    mockBuildEndingContext.mockResolvedValue(mockContext);
    mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

    await generateEnding(mockRequest);

    const calledPrompt = mockGeminiClient.generateContent.mock.calls[0][0];
    expect(calledPrompt).toContain('Companion dragged off at turn 7');
    expect(calledPrompt).toContain('Camp kid on dawn deadline');
    expect(calledPrompt).toContain('RULES FOR OPEN THREADS:');
  });
});
