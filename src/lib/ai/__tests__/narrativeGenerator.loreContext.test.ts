/**
 * Tests for narrative generator lore context integration
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { createMockWorldStore, createMockCharacterStore } from '@/lib/test-utils';

// Mock dependencies
jest.mock('../loreContextHelper');
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('../../promptTemplates/narrativeTemplateManager');

const mockWorld = {
  id: 'world-123',
  name: 'Epic Fantasy World',
  description: 'A world of magic and adventure',
  genre: 'fantasy',
  attributes: [],
    skills: [],
    derivedStats: [],
    settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 27,
    skillPointPool: 20
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  toneSettings: {
    contentRating: 'PG' as const,
    narrativeStyle: 'epic' as const,
    languageComplexity: 'moderate' as const
  }
};

describe('NarrativeGenerator lore context integration', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAIClient: { generateContent: jest.Mock };
  let mockGetLoreContextForPrompt: jest.MockedFunction<typeof getLoreContextForPrompt>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAIClient = {
      generateContent: jest.fn()
    };

    narrativeGenerator = new NarrativeGenerator(mockAIClient);

    // Setup mocks
    mockGetLoreContextForPrompt = getLoreContextForPrompt as jest.MockedFunction<typeof getLoreContextForPrompt>;

    (useWorldStore.getState as jest.Mock).mockReturnValue(createMockWorldStore({
      worlds: { 'world-123': mockWorld }
    }));

    (useCharacterStore.getState as jest.Mock).mockReturnValue(createMockCharacterStore({
      characters: {}
    }));

    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      jest.fn().mockReturnValue('Base narrative template')
    );
  });

  it('should include lore context when generating narrative segments', async () => {
    const loreContext = `
Established World Facts:
characters: mentor = Gandalf the Wise
locations: current_location = Rivendell
events: recent_event = The Council has been called
rules: world_rule = Elven magic protects this realm
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    // Provide responses for both initial generation and potential complexity rewrite
    mockAIClient.generateContent
      .mockResolvedValueOnce({
        content: 'The ancient halls of Rivendell echo with whispered discussions as Gandalf approaches...'
      })
      .mockResolvedValueOnce({
        content: 'The ancient halls of Rivendell echo with whispered discussions as Gandalf approaches...'
      });

    const request = {
      worldId: 'world-123',
      sessionId: 'session-456',
      characterIds: ['char-1'],
      generationParameters: {
        segmentType: 'scene' as const,
        desiredLength: 'medium' as const
      }
    };

    await narrativeGenerator.generateSegment(request);

    // Verify lore context was requested with sessionId
    expect(mockGetLoreContextForPrompt).toHaveBeenCalledWith('world-123', 'session-456');

    // Verify the AI was called with enhanced prompt including lore
    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('Established World Facts:');
    expect(capturedPrompt).toContain('characters: mentor = Gandalf the Wise');
    expect(capturedPrompt).toContain('locations: current_location = Rivendell');
    expect(capturedPrompt).toContain('rules: world_rule = Elven magic protects this realm');
  });

  it('should include lore context in initial scene generation', async () => {
    const loreContext = `
Established World Facts:
characters: protagonist = Hero of Legend
locations: starting_location = Village of Beginnings
rules: journey_rule = Every hero must start their journey at dawn
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    // Provide responses for both initial generation and potential complexity rewrite
    mockAIClient.generateContent
      .mockResolvedValueOnce({
        content: 'As dawn breaks over the Village of Beginnings, the Hero of Legend prepares for the journey ahead...'
      })
      .mockResolvedValueOnce({
        content: 'As dawn breaks over the Village of Beginnings, the Hero of Legend prepares for the journey ahead...'
      });

    await narrativeGenerator.generateInitialScene('world-123', ['char-1']);

    expect(mockGetLoreContextForPrompt).toHaveBeenCalledWith('world-123', undefined);

    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('Established World Facts:');
    expect(capturedPrompt).toContain('Hero of Legend');
    expect(capturedPrompt).toContain('Village of Beginnings');
  });

  it('should handle narrative generation with empty lore gracefully', async () => {
    mockGetLoreContextForPrompt.mockReturnValue('');

    // Provide responses for both initial generation and potential complexity rewrite
    mockAIClient.generateContent
      .mockResolvedValueOnce({
        content: 'A new adventure begins in an unexplored realm...'
      })
      .mockResolvedValueOnce({
        content: 'A new adventure begins in an unexplored realm...'
      });

    const request = {
      worldId: 'world-123',
      sessionId: 'session-456',
      characterIds: ['char-1'],
      generationParameters: {
        segmentType: 'scene' as const,
        desiredLength: 'short' as const
      }
    };

    const result = await narrativeGenerator.generateSegment(request);

    expect(result.content).toBe('A new adventure begins in an unexplored realm...');
    expect(mockGetLoreContextForPrompt).toHaveBeenCalledWith('world-123', 'session-456');
  });

  it('should generate narrative consistent with established lore', async () => {
    const loreContext = `
Established World Facts:
characters: villain = The Shadow King
characters: ally = Princess Luna
locations: fortress = Tower of Shadows
rules: magic_system = Light magic weakens shadow magic
events: prophecy = The chosen one will bring balance
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    // Mock AI response that respects established lore
    // Provide responses for both initial generation and potential complexity rewrite
    mockAIClient.generateContent
      .mockResolvedValueOnce({
        content: `Princess Luna raises her staff, casting brilliant light magic that begins to weaken the Shadow King's dark enchantments around the Tower of Shadows. The ancient prophecy seems to be unfolding before your eyes.`
      })
      .mockResolvedValueOnce({
        content: `Princess Luna raises her staff, casting brilliant light magic that begins to weaken the Shadow King's dark enchantments around the Tower of Shadows. The ancient prophecy seems to be unfolding before your eyes.`
      });

    const request = {
      worldId: 'world-123',
      sessionId: 'session-789',
      characterIds: ['char-1'],
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-final',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: ['final-battle'],
        sessionId: 'session-789',
        currentLocation: 'Tower of Shadows',
        currentSituation: 'Final confrontation with the Shadow King',
        recentSegments: []
      },
      generationParameters: {
        segmentType: 'action' as const,
        desiredLength: 'medium' as const
      }
    };

    const result = await narrativeGenerator.generateSegment(request);

    expect(result.content).toContain('Princess Luna');
    expect(result.content).toContain('Shadow King');
    expect(result.content).toContain('Tower of Shadows');
    expect(result.content).toContain('light magic');
    expect(result.content).toContain('prophecy');
  });

  it('should preserve lore context order in AI prompts', async () => {
    const loreContext = `
Established World Facts:
characters: hero = The Chosen One
locations: sanctuary = Sacred Grove
rules: power_source = Ancient crystals amplify magic
events: ritual = Monthly blessing ceremony
`;

    mockGetLoreContextForPrompt.mockReturnValue(loreContext);

    // Provide responses for both initial generation and potential complexity rewrite
    mockAIClient.generateContent
      .mockResolvedValueOnce({
        content: 'The narrative continues...'
      })
      .mockResolvedValueOnce({
        content: 'The narrative continues...'
      });

    const request = {
      worldId: 'world-123',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      generationParameters: {
        segmentType: 'scene' as const
      }
    };

    await narrativeGenerator.generateSegment(request);

    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];

    // Verify lore context appears after base template but before other enhancements
    const baseTemplateIndex = capturedPrompt.indexOf('Base narrative template');
    const loreContextIndex = capturedPrompt.indexOf('Established World Facts:');

    expect(baseTemplateIndex).toBeLessThan(loreContextIndex);
    expect(loreContextIndex).toBeGreaterThan(-1);
  });
});