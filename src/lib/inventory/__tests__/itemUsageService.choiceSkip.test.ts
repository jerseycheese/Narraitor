// Issue #925: after item usage, choice regeneration must be skipped when the
// item-usage segment ends the session (fatal outcome) — and existing decisions
// must stay intact rather than being cleared.

import { processItemUsage } from '../itemUsageService';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import type { NarrativeGenerationResult } from '@/types/narrative.types';

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({ generateContent: jest.fn() })),
}));

jest.mock('@/lib/narrative/applyWorldClockUpdates', () => ({
  applyWorldClockUpdates: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/narrative/applyWorldStateThreadUpdates', () => ({
  applyWorldStateThreadUpdates: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/ai/narrativeGenerator.npc', () => ({
  ...jest.requireActual('@/lib/ai/narrativeGenerator.npc'),
  syncNpcMetadata: jest.fn(),
}));

jest.mock('@/lib/ai/structuredLoreExtractor', () => ({
  extractStructuredLore: jest.fn().mockResolvedValue({
    characters: [],
    locations: [],
    events: [],
    rules: [],
  }),
}));

jest.mock('@/lib/ai/loreContextHelper', () => ({
  ...jest.requireActual('@/lib/ai/loreContextHelper'),
  getLoreContextForPrompt: jest.fn(() => ''),
}));

const mockGenerateSegment = jest.fn();
const mockGeneratePlayerChoices = jest.fn();

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateSegment: mockGenerateSegment,
    generatePlayerChoices: mockGeneratePlayerChoices,
  })),
}));

const buildGeneration = (tags: string[]): NarrativeGenerationResult => ({
  content: 'You drink the vial and the world goes dark.',
  segmentType: 'action',
  metadata: { characterIds: [], tags },
});

describe('processItemUsage - skip choice regeneration on session end (#925)', () => {
  let worldId: string;
  let characterId: string;
  let sessionId: string;
  let itemId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    useInventoryStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();

    worldId = useWorldStore.getState().create({
      name: 'Fantasy Realm',
      description: 'A magical world',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    characterId = useCharacterStore.getState().create({
      name: 'Aria the Brave',
      worldId,
      description: 'A courageous warrior',
      level: 1,
      isPlayer: true,
      status: { conditions: [] },
      inventory: {
        characterId: '',
        items: [],
        capacity: 0,
        categories: [],
        itemOrder: [],
      },
      background: {
        history: 'A courageous warrior',
        personality: 'Brave',
        goals: [],
        fears: [],
        relationships: [],
      },
      attributes: [],
      skills: [],
      derivedStats: [],
    });

    sessionId = `session-${worldId}-${characterId}`;
    useSessionStore.getState().setSessionId(sessionId);
    useSessionStore.getState().setCharacterId(characterId);
    useSessionStore.setState({ worldId });

    itemId = useInventoryStore.getState().addItem(characterId, {
      name: 'Vial of Poison',
      description: 'A risky concoction',
      stackable: false,
      categorization: {
        categoryId: 'consumables',
        source: 'manual',
        classifiedAt: new Date().toISOString(),
      },
      acquisition: {
        method: 'loot',
        acquiredAt: new Date().toISOString(),
        quantity: 1,
      },
    });

    mockGeneratePlayerChoices.mockResolvedValue({
      prompt: 'What do you do next?',
      options: [{ id: 'opt-1', text: 'Continue' }],
      decisionWeight: 'minor',
      contextSummary: 'after item use',
    });
  });

  it('regenerates choices after a normal item-usage segment', async () => {
    mockGenerateSegment.mockResolvedValue(buildGeneration(['item-usage']));

    const result = await processItemUsage({
      characterId,
      itemId,
      sessionId,
      worldId,
    });

    expect(result.success).toBe(true);
    expect(mockGeneratePlayerChoices).toHaveBeenCalledTimes(1);
  });

  it('skips choice regeneration and keeps existing decisions when item usage is fatal', async () => {
    mockGenerateSegment.mockResolvedValue(
      buildGeneration(['item-usage', 'fatal-outcome'])
    );

    // Seed an existing decision that must survive a fatal item usage.
    useNarrativeStore.getState().addDecision(sessionId, {
      prompt: 'Existing decision',
      options: [{ id: 'existing-1', text: 'Stay' }],
    });

    const result = await processItemUsage({
      characterId,
      itemId,
      sessionId,
      worldId,
    });

    expect(result.success).toBe(true);
    expect(mockGeneratePlayerChoices).not.toHaveBeenCalled();

    const decisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
    expect(decisions.some((d) => d.prompt === 'Existing decision')).toBe(true);
  });
});
