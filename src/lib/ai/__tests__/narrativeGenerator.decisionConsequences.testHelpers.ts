/**
 * Shared test helpers for narrativeGenerator decision-consequences tests
 */

import { playerDecisionTracker } from '../playerDecisionTracker';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { getNarrativeTemplate } from '../../promptTemplates/narrativeTemplateManager';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { useLoreStore } from '@/state/loreStore';
import { extractStructuredLore } from '../structuredLoreExtractor';
import { getDetailedToneInstructions } from '../toneSettingsGuidance';
import { PlayerDecision } from '@/types/personalization.types';
import { getTimestamp } from '@/lib/utils/timestamp';

// Re-export centralized timer utilities
export { setupTestTimers } from '@/lib/test-utils/testTimers';

const mockPlayerDecisionTracker = playerDecisionTracker as jest.Mocked<
  typeof playerDecisionTracker
>;

const mockWorld = {
  id: 'world-1',
  name: 'Test World',
  genre: 'fantasy',
  description: 'A magical realm',
  attributes: [],
  skills: [],
  derivedStats: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 10,
    attributePointPool: 30,
    skillPointPool: 50,
  },
  toneSettings: {
    contentRating: 'teen' as const,
    narrativeStyle: 'balanced' as const,
    languageComplexity: 'moderate' as const,
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockCharacter = {
  id: 'char-1',
  name: 'Hero',
  worldId: 'world-1',
  description: 'A brave warrior',
  level: 1,
  isPlayer: true,
  background: {
    history: 'A brave warrior',
    personality: 'Courageous',
    goals: [],
    fears: [],
    relationships: [],
  },
  attributes: [],
  skills: [],
  derivedStats: [],
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 10,
    categories: [],
    itemOrder: [],
  },
  status: {
    conditions: [],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

/**
 * Creates sample past decisions with deterministic timestamps
 */
export function createPastDecisions(): PlayerDecision[] {
  // Set time to 1 day ago for first decision
  jest.setSystemTime(new Date('2025-01-14T12:00:00Z'));
  const oneDayAgo = getTimestamp();

  // Set time to 12 hours ago for second decision
  jest.setSystemTime(new Date('2025-01-15T00:00:00Z'));
  const twelveHoursAgo = getTimestamp();

  // Reset to "now"
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

  return [
    {
      id: 'decision-1',
      prompt: 'An injured merchant lies on the ground. What do you do?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Help the injured merchant',
      choiceType: 'helpful',
      timestamp: oneDayAgo,
      context: { situation: 'moral dilemma', charactersPresent: ['merchant'] },
    },
    {
      id: 'decision-2',
      prompt: 'Bandits block your path. How do you handle this?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Negotiate instead of fighting',
      choiceType: 'diplomatic',
      timestamp: twelveHoursAgo,
      context: {
        situation: 'conflict resolution',
        charactersPresent: ['bandit leader'],
      },
    },
  ];
}

/**
 * Sets up all mocks for decision-consequences tests
 */
export function setupDecisionConsequencesMocks(
  pastDecisions: PlayerDecision[]
): void {
  // Mock world store with implementation to ensure it persists
  (useWorldStore.getState as jest.Mock).mockImplementation(() => ({
    worlds: { 'world-1': mockWorld },
    worldStates: {}, // Add worldStates to prevent undefined access
    currentWorldId: 'world-1',
    error: null,
    loading: false,
  }));

  // Mock character store
  (useCharacterStore.getState as jest.Mock).mockImplementation(() => ({
    characters: { 'char-1': mockCharacter },
    currentCharacterId: 'char-1',
    error: null,
    loading: false,
  }));

  // Mock aiContext store for goal context
  (useAiContextStore.getState as jest.Mock).mockImplementation(() => ({
    buildContextForSession: jest.fn().mockReturnValue({
      goalContext: null,
      activeGoals: [],
    }),
  }));

  // Mock inventory store
  (useInventoryStore.getState as jest.Mock).mockImplementation(() => ({
    getCharacterItems: jest.fn().mockReturnValue([]),
  }));

  // Mock NPC store
  (useNPCStore.getState as jest.Mock).mockImplementation(() => ({
    getNPCsByWorld: jest.fn().mockReturnValue([]),
  }));

  mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue(pastDecisions);
  mockPlayerDecisionTracker.getRelevantDecisions.mockReturnValue(pastDecisions);

  // Mock template manager
  (getNarrativeTemplate as jest.Mock).mockReturnValue(
    (context: { worldName: string; characterIds?: string[] }) =>
      `Generated prompt for ${context.worldName} with ${context.characterIds?.length || 0} characters`
  );

  // Mock lore context helper
  (getLoreContextForPrompt as jest.Mock).mockReturnValue('');

  (useLoreStore.getState as jest.Mock).mockReturnValue({
    getLoreContext: jest.fn().mockReturnValue({ factIds: [] }),
    recordLoreMentions: jest.fn(),
    recordLoreUsage: jest.fn(),
    addStructuredLore: jest.fn()
  });

  (extractStructuredLore as jest.Mock).mockResolvedValue({
    characters: [],
    locations: [],
    events: [],
    rules: []
  });

  // Mock tone settings guidance
  (getDetailedToneInstructions as jest.Mock).mockReturnValue('');
}
