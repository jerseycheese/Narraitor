// src/lib/ai/__tests__/endingGenerator.test.ts

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
import { contextManager } from '../contextManager';
import { promptTemplateManager } from '../../promptTemplates/promptTemplateManager';

// Mock createDefaultGeminiClient to return our mocked client
const mockGeminiClient = {
  generateContent: jest.fn()
};

jest.mock('../defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => mockGeminiClient
}));
import type { 
  EndingGenerationRequest,
  NarrativeSegment 
} from '../../../types/narrative.types';
import type { Character } from '../../../types/character.types';
import type { World } from '../../../types/world.types';
import type { JournalEntry } from '../../../types/journal.types';

// Mock logger first - need to handle both named and default exports
jest.mock('../../utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  };
  
  // Create a constructor class for default export  
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

// Mock dependencies
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
  contextManager: {
    buildEndingContext: jest.fn()
  }
}));

jest.mock('../../promptTemplates/promptTemplateManager', () => ({
  promptTemplateManager: {
    getTemplate: jest.fn(),
    addTemplate: jest.fn()
  }
}));

jest.mock('../../../state/sessionStore');
jest.mock('../../../state/journalStore');

// The mocked modules are now available through imports

describe('endingGenerator', () => {
  const mockWorld: World = {
    id: 'world-123',
    name: 'Epic Fantasy Realm',
    description: 'A land of magic and adventure',
    theme: 'High Fantasy',
    settings: {
      magicLevel: 'high',
      technologyLevel: 'medieval',
      dangerLevel: 'moderate'
    },
    atmosphere: 'Epic and adventurous',
    imageUrl: '',
    isActive: false,
    attributes: [],
    skills: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCharacter: Character = {
    id: 'char-456',
    name: 'Aria Stormblade',
    worldId: 'world-123',
    attributes: [
      { attributeId: 'attr-strength', value: 18 },
      { attributeId: 'attr-dexterity', value: 14 },
      { attributeId: 'attr-intelligence', value: 10 }
    ],
    skills: [
      { skillId: 'skill-combat', level: 85, experience: 2500, isActive: true },
      { skillId: 'skill-leadership', level: 60, experience: 1800, isActive: true }
    ],
    background: {
      history: 'A seasoned warrior seeking redemption',
      personality: 'Brave and honorable',
      goals: ['Defeat the dark lord and restore peace', 'Find inner peace'],
      fears: ['Failure', 'Losing allies'],
      relationships: []
    },
    inventory: {
      items: [],
      maxWeight: 100,
      currentWeight: 0
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
      location: 'Dark Castle'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockNarrativeSegments: NarrativeSegment[] = [
    {
      id: 'seg-1',
      content: 'Aria entered the dark castle, sword drawn.',
      type: 'action',
      sessionId: 'session-789',
      worldId: 'world-123',
      metadata: { tags: ['combat', 'castle'], mood: 'tense' },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'seg-2',
      content: 'The final battle with the dark lord was epic.',
      type: 'action',
      sessionId: 'session-789',
      worldId: 'world-123',
      metadata: { tags: ['combat', 'boss-fight'], mood: 'action' },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockJournalEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      sessionId: 'session-789',
      characterId: 'char-456',
      worldId: 'world-123',
      content: 'Defeated the dragon and saved the village',
      category: 'quest',
      tags: ['achievement', 'dragon'],
      metadata: { importance: 'high' },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEnding', () => {
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

      const mockPrompt = 'Generate an epic ending...';
      const mockResponse = `{
        "epilogue": "As the sun set over the kingdom, Aria stood victorious...",
        "characterLegacy": "Aria Stormblade would be remembered as the hero who saved the realm...",
        "worldImpact": "The defeat of the dark lord brought peace to the land for generations...",
        "tone": "triumphant",
        "achievements": ["Dragon Slayer", "Savior of the Realm", "Master Warrior"]
      }`;

      // Set up the mocks with clear return values
      const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
      const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;
      
      mockContextManager.buildEndingContext.mockResolvedValue(mockContext);
      mockPromptTemplateManager.getTemplate.mockReturnValue({ content: mockPrompt });
      mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

      const result = await endingGenerator.generateEnding(mockRequest);

      expect(result).toMatchObject({
        epilogue: expect.any(String),
        characterLegacy: expect.any(String),
        worldImpact: expect.any(String),
        tone: 'triumphant',
        achievements: expect.arrayContaining(['Dragon Slayer'])
      });

      expect(mockContextManager.buildEndingContext).toHaveBeenCalledWith(mockRequest);
      expect(mockPromptTemplateManager.getTemplate).toHaveBeenCalledWith('ending');
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    });

    it('should use desired tone when provided', async () => {
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-789',
        characterId: 'char-456',
        worldId: 'world-123',
        endingType: 'player-choice',
        desiredTone: 'bittersweet'
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
        "tone": "bittersweet",
        "achievements": ["Pyrrhic Victory", "The Sacrifice"]
      }`;

      const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
      const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;
      
      mockContextManager.buildEndingContext.mockResolvedValue(mockContext);
      mockPromptTemplateManager.getTemplate.mockReturnValue({ content: 'Generate bittersweet ending...' });
      mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

      const result = await endingGenerator.generateEnding(mockRequest);

      expect(result.tone).toBe('bittersweet');
      expect(result.epilogue).toContain('cost');
    });

    it('should handle generation errors gracefully', async () => {
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-789',
        characterId: 'char-456',
        worldId: 'world-123',
        endingType: 'session-limit'
      };

      const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
      
      mockContextManager.buildEndingContext.mockRejectedValue(
        new Error('Failed to build context')
      );

      await expect(endingGenerator.generateEnding(mockRequest)).rejects.toThrow(
        'Failed to generate ending'
      );
    });

    it('should calculate play time when session data is available', async () => {
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-789',
        characterId: 'char-456',
        worldId: 'world-123',
        endingType: 'player-choice'
      };

      const mockContext = {
        world: mockWorld,
        character: mockCharacter,
        narrativeSegments: mockNarrativeSegments,
        journalEntries: mockJournalEntries,
        sessionStartTime: new Date(Date.now() - 3600000) // 1 hour ago
      };

      const mockResponse = `{
        "epilogue": "The journey ends...",
        "characterLegacy": "A true hero...",
        "worldImpact": "Forever changed...",
        "tone": "triumphant",
        "achievements": ["Quick Victory"]
      }`;

      const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
      const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;
      mockContextManager.buildEndingContext.mockResolvedValue(mockContext);
      mockPromptTemplateManager.getTemplate.mockReturnValue({ content: 'Generate ending...' });
      mockGeminiClient.generateContent.mockResolvedValue({ content: mockResponse });

      const result = await endingGenerator.generateEnding(mockRequest);

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

      const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
      const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;
      
      mockContextManager.buildEndingContext.mockResolvedValue(mockContext);
      mockPromptTemplateManager.getTemplate.mockReturnValue({ content: 'Base prompt' });
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

      await endingGenerator.generateEnding(mockRequest);

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

        const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
        const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;
        
        mockContextManager.buildEndingContext.mockResolvedValue(mockContext);
        mockPromptTemplateManager.getTemplate.mockReturnValue({ content: `Generate ${type} ending...` });
        mockGeminiClient.generateContent.mockResolvedValue({ content: `{
          "epilogue": "The hero ${expectedContent}...",
          "characterLegacy": "Remembered well...",
          "worldImpact": "Things changed...",
          "tone": "hopeful",
          "achievements": ["Completed"]
        }` });

        const result = await endingGenerator.generateEnding(mockRequest);

        expect(result.epilogue).toContain(expectedContent);
      }
    });
  });

  describe('retryGeneration', () => {
    it('should retry failed generation attempts', async () => {
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

      const mockContextManager = contextManager as jest.Mocked<typeof contextManager>;
      const mockPromptTemplateManager = promptTemplateManager as jest.Mocked<typeof promptTemplateManager>;
      
      mockContextManager.buildEndingContext.mockResolvedValue(mockContext);
      mockPromptTemplateManager.getTemplate.mockReturnValue({ content: 'Generate ending...' });
      
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