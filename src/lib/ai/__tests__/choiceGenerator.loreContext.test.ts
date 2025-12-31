/**
 * Tests for choice generator lore context integration
 */

import { ChoiceGenerator } from '../choiceGenerator';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { useWorldStore } from '@/state/worldStore';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { createMockWorldStore } from '@/lib/test-utils';

// Mock dependencies
jest.mock('../loreContextHelper');
jest.mock('@/state/worldStore');
jest.mock('../../promptTemplates/narrativeTemplateManager');
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({
      getCharacterItems: () => []
    })
  }
}));

const mockWorld = {
  id: 'world-123',
  name: 'Fantasy Realm',
  description: 'A magical fantasy world',
  genre: 'fantasy',
  attributes: [],
    skills: [],
    settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 27,
    skillPointPool: 20
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  toneSettings: {
    contentRating: 'PG-13' as const,
    narrativeStyle: 'action-packed' as const,
    languageComplexity: 'moderate' as const
  }
};

describe('ChoiceGenerator lore context integration', () => {
  let choiceGenerator: ChoiceGenerator;
  let mockAIClient: { generateContent: jest.Mock };
  let mockGetLoreContextForPrompt: jest.MockedFunction<typeof getLoreContextForPrompt>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAIClient = {
      generateContent: jest.fn()
    };

    choiceGenerator = new ChoiceGenerator(mockAIClient);

    // Setup mocks
    mockGetLoreContextForPrompt = getLoreContextForPrompt as jest.MockedFunction<typeof getLoreContextForPrompt>;
    
    (useWorldStore.getState as jest.Mock).mockReturnValue(createMockWorldStore({
      worlds: { 'world-123': mockWorld }
    }));

    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      jest.fn().mockReturnValue('Base prompt template')
    );
  });

  it('should include lore context when generating choices', async () => {
    // Setup lore context
    const loreContext = `
Established World Facts:
characters: hero = Sir Gareth the Brave
locations: current_location = Ancient Forest
rules: magic_rule = Magic requires concentration
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    // Mock AI response
    mockAIClient.generateContent.mockResolvedValue({
      content: 'What will you do?\n\n1. Use magic to illuminate the path\n2. Search for tracks\n3. Call out for Sir Gareth'
    });

    const params = {
      worldId: 'world-123',
      sessionId: 'session-1',
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Ancient Forest',
        recentSegments: []
      },
      characterIds: ['char-1']
    };

    await choiceGenerator.generateChoices(params);

    // Verify lore context was requested for the correct world and session
    expect(mockGetLoreContextForPrompt).toHaveBeenCalledWith('world-123', 'session-1');

    // Verify the AI was called with enhanced prompt that includes lore
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Established World Facts:')
    );
    expect(mockAIClient.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('characters: hero = Sir Gareth the Brave')
    );
  });

  it('should handle empty lore context gracefully', async () => {
    mockGetLoreContextForPrompt.mockReturnValue('');

    mockAIClient.generateContent.mockResolvedValue({
      content: 'What will you do?\n\n1. Look around\n2. Move forward\n3. Wait'
    });

    const params = {
      worldId: 'world-123',
      sessionId: 'session-1',
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Empty Room',
        recentSegments: []
      },
      characterIds: ['char-1']
    };

    const result = await choiceGenerator.generateChoices(params);

    expect(result.options).toHaveLength(3);
    expect(mockGetLoreContextForPrompt).toHaveBeenCalledWith('world-123', 'session-1');
  });

  it('should generate choices consistent with established lore', async () => {
    const loreContext = `
Established World Facts:
characters: companion = Lady Elara the Wise
locations: forbidden_zone = The Cursed Marshlands
rules: travel_rule = The marshlands cannot be crossed at night
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    // Mock AI response that respects the lore
    mockAIClient.generateContent.mockResolvedValue({
      content: `What will you do?

1. Ask Lady Elara for guidance about the marshlands
2. Wait until morning to cross the Cursed Marshlands
3. Find an alternative route around the forbidden zone`
    });

    const params = {
      worldId: 'world-123',
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Edge of Cursed Marshlands',
        currentSituation: 'Approaching dangerous territory at dusk',
        recentSegments: []
      },
      characterIds: ['char-1']
    };

    const result = await choiceGenerator.generateChoices(params);

    expect(result.options).toHaveLength(3);
    expect(result.options[0].text).toContain('Lady Elara');
    expect(result.options[1].text).toContain('morning');
    expect(result.options[2].text).toContain('alternative route');
  });

  it('should include lore context in prompt enhancement', async () => {
    const loreContext = `
Established World Facts:
rules: combat_rule = Magic users become exhausted after casting spells
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    mockAIClient.generateContent.mockResolvedValue({
      content: 'What will you do?\n\n1. Rest to recover from spell exhaustion\n2. Proceed carefully\n3. Look for help'
    });

    const params = {
      worldId: 'world-123',
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentSituation: 'Just finished casting a powerful spell',
        recentSegments: []
      },
      characterIds: ['char-1']
    };

    await choiceGenerator.generateChoices(params);

    // Verify the final enhanced prompt includes both base content and lore context
    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('Base prompt template');
    expect(capturedPrompt).toContain('Established World Facts:');
    expect(capturedPrompt).toContain('combat_rule = Magic users become exhausted');
  });
});
