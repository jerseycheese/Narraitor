import { buildPromptDebugInfo, isDebugInfoEnabled, type DebugInfoContext } from '../debugInfoBuilder';
import { World } from '@/types/world.types';

// Mock process.env for testing
const originalEnv = process.env.NODE_ENV;

describe('debugInfoBuilder', () => {
  afterEach(() => {
    // Restore original environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });

  describe('isDebugInfoEnabled', () => {
    it('should return true in development mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });
      expect(isDebugInfoEnabled()).toBe(true);
    });

    it('should return false in production mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
      expect(isDebugInfoEnabled()).toBe(false);
    });

    it('should return false in test mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true,
      });
      expect(isDebugInfoEnabled()).toBe(false);
    });
  });

  describe('buildPromptDebugInfo', () => {
    const mockWorld: World = {
      id: 'world-1',
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 20,
        skillPointPool: 30,
      },
    };

    it('should build basic debug info', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt text',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
      };

      const result = buildPromptDebugInfo(context);

      expect(result.fullPrompt).toBe('Test prompt text');
      expect(result.templateName).toBe('Scene Template');
      expect(result.modelUsed).toBe('gemini-2.0-flash');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should include tone settings when provided', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
        toneSettings: {
          contentRating: 'PG-13',
          narrativeStyle: 'dramatic',
          languageComplexity: 'moderate',
          customInstructions: 'Keep it light',
        },
      };

      const result = buildPromptDebugInfo(context);

      expect(result.toneSettings).toBeDefined();
      expect(result.toneSettings?.complexity).toBe('moderate');
      expect(result.toneSettings?.customTone).toBe('Keep it light');
    });

    it('should include token usage when provided', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
        tokenUsage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      };

      const result = buildPromptDebugInfo(context);

      expect(result.tokenUsage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
    });

    it('should extract lore context from lore string', () => {
      const loreContext = `LORE CONTEXT:

Title: Ancient Magic
Magic is rare and dangerous in this world.

Title: The Old Kingdom
The kingdom fell 500 years ago.`;

      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
        loreContext,
      };

      const result = buildPromptDebugInfo(context);

      expect(result.loreContext).toBeDefined();
      expect(result.loreContext?.length).toBeGreaterThan(0);
    });

    it('should extract active goals from prompt', () => {
      const promptWithGoals = `You are generating narrative.

CURRENT NARRATIVE GOALS:
- Find the ancient artifact
- Rescue the princess
- Defeat the dragon

Please consider these goals when generating the narrative content.`;

      const context: DebugInfoContext = {
        fullPrompt: promptWithGoals,
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
      };

      const result = buildPromptDebugInfo(context);

      expect(result.activeGoals).toBeDefined();
      expect(result.activeGoals?.length).toBe(3);
      expect(result.activeGoals).toContain('Find the ancient artifact');
    });

    it('should extract inventory context from prompt', () => {
      const promptWithInventory = `Generate narrative.

INVENTORY CONTEXT:
EQUIPPED ITEMS:
- Magic Sword
- Steel Armor

INVENTORY:
- Health Potion
- Gold Coin`;

      const context: DebugInfoContext = {
        fullPrompt: promptWithInventory,
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
      };

      const result = buildPromptDebugInfo(context);

      expect(result.inventoryContext).toBeDefined();
      expect(result.inventoryContext?.length).toBe(4);

      const equippedItems = result.inventoryContext?.filter(item => item.isEquipped);
      expect(equippedItems?.length).toBe(2);
    });

    it('should include character context when provided', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
        characterIds: ['char-1', 'char-2'],
      };

      const result = buildPromptDebugInfo(context);

      expect(result.characterContext).toBeDefined();
      expect(result.characterContext?.length).toBe(2);
    });

    it('should include previous segment context when provided', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
        previousSegmentContent: 'You enter the dark cave. Water drips from the ceiling.',
        previousSegmentType: 'scene',
      };

      const result = buildPromptDebugInfo(context);

      expect(result.previousSegmentContext).toBeDefined();
      expect(result.previousSegmentContext?.type).toBe('scene');
      expect(result.previousSegmentContext?.excerpt).toContain('You enter the dark cave');
    });

    it('should include recent decisions when provided', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
        recentDecisions: [
          {
            decisionText: 'What do you do?',
            selectedOption: 'Enter the cave',
            timestamp: new Date('2024-01-01'),
          },
        ],
      };

      const result = buildPromptDebugInfo(context);

      expect(result.recentDecisions).toBeDefined();
      expect(result.recentDecisions?.length).toBe(1);
      expect(result.recentDecisions?.[0].selectedOption).toBe('Enter the cave');
    });

    it('should omit undefined optional fields', () => {
      const context: DebugInfoContext = {
        fullPrompt: 'Test prompt',
        templateName: 'Scene Template',
        world: mockWorld,
        modelUsed: 'gemini-2.0-flash',
      };

      const result = buildPromptDebugInfo(context);

      expect(result.loreContext).toBeUndefined();
      expect(result.activeGoals).toBeUndefined();
      expect(result.inventoryContext).toBeUndefined();
      expect(result.previousSegmentContext).toBeUndefined();
      expect(result.recentDecisions).toBeUndefined();
    });
  });
});
