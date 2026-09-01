import { buildChoicePrompt } from '../choiceGenerator.prompt';
import type { NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { playerDecisionTracker } from '../playerDecisionTracker';

jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  getNarrativeTemplate: jest.fn().mockReturnValue((context: { worldName: string }) =>
    `BASE_PROMPT:${context.worldName}`
  ),
}));

jest.mock('../toneSettingsGuidance', () => ({
  getDetailedToneInstructions: jest.fn(() => '\nTONE_GUIDANCE'),
}));

jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn(() => '\n\nLORE_CONTEXT'),
}));

jest.mock('@/lib/promptContext/inventoryContextBuilder', () => ({
  buildInventoryContext: jest.fn(() => ({ context: 'INVENTORY_CONTEXT' })),
}));

jest.mock('../attributeSkillFormatter', () => ({
  formatSkillsForNarrative: jest.fn(() => 'Stealth (Novice)'),
}));

jest.mock('../playerDecisionTracker', () => ({
  playerDecisionTracker: {
    getRelevantDecisions: jest.fn(() => [{ id: 'decision-1' }]),
  },
}));

jest.mock('../simpleDecisionFormatter', () => ({
  formatDecisions: jest.fn(() => 'DECISION_HISTORY'),
}));

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({
      getCharacterItems: jest.fn(() => [{ id: 'item-1' }]),
    }),
  },
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: jest.fn().mockReturnValue({
      characters: {
        'char-1': {
          name: 'Ava',
          skills: [{ name: 'Stealth', level: 1 }],
        },
      },
    }),
  },
}));

const narrativeContext: NarrativeContext = {
  worldId: 'world-1',
  currentSceneId: 'scene-1',
  characterIds: ['char-1'],
  previousSegments: [],
  currentTags: [],
  sessionId: 'session-1',
  currentLocation: 'Forest',
  currentSituation: 'Exploring',
};

describe('buildChoicePrompt', () => {
  it('builds a prompt with lore, inventory, skills, tone, and history', () => {
    const world = createMockWorld({
      id: 'world-1',
      name: 'Test World',
      skills: [
        {
          id: 'skill-1',
          worldId: 'world-1',
          name: 'Stealth',
          description: 'Stay hidden',
          difficulty: 'easy',
          baseValue: 1,
          minValue: 0,
          maxValue: 5,
        },
      ],
    });

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: true,
    });

    expect(prompt).toContain('BASE_PROMPT:Test World');
    expect(prompt).toContain('INVENTORY_CONTEXT');
    expect(prompt).toContain('CHARACTER SKILLS CONTEXT:');
    expect(prompt).toContain('Stealth (Novice)');
    expect(prompt).toContain('LORE_CONTEXT');
    expect(prompt).toContain('TONE_GUIDANCE');
    expect(prompt).toContain('## Past Decision History');
    expect(prompt).toContain('DECISION_HISTORY');
  });

  it('calls getRelevantDecisions with limit 10', () => {
    const world = createMockWorld({ id: 'world-1' });
    buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: true,
    });

    expect(playerDecisionTracker.getRelevantDecisions).toHaveBeenCalledWith(
      expect.objectContaining({ worldId: 'world-1', sessionId: 'session-1' }),
      10,
      expect.objectContaining({ worldId: 'world-1', sessionId: 'session-1' })
    );
  });

  it('uses fields from the supplied SessionSnapshot rather than live stores', () => {
    const world = createMockWorld({
      id: 'world-1',
      name: 'Test World',
    });

    const snapshot = {
      sessionId: 'session-1',
      worldId: 'world-1',
      characterId: 'char-snapshot',
      turnIndex: 3,
      segments: [],
      decisions: [],
      character: {
        id: 'char-snapshot',
        name: 'SnapshotHero',
        worldId: 'world-1',
        level: 5,
        skills: [{ id: 's1', characterId: 'char-snapshot', name: 'Stealth', level: 2 }],
      },
      inventory: [
        {
          id: 'item-snapshot',
          name: 'Snapshot Blade',
          characterId: 'char-snapshot',
          quantity: 1,
          equipped: true,
        },
      ],
      worldThreads: [],
      worldState: undefined,
      loreContext: '\n\nSNAPSHOT_LORE_CONTEXT',
      npcs: [{ id: 'npc-snapshot', name: 'Snapshot Guide', worldId: 'world-1' }],
      conditions: [],
      endedSessions: {},
    };

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['char-snapshot'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      snapshot: snapshot as unknown as import('@/types/turnResolver.types').SessionSnapshot,
    });

    expect(prompt).toContain('SnapshotHero');
    expect(prompt).toContain('CHARACTER SKILLS CONTEXT:');
    expect(prompt).toContain('SNAPSHOT_LORE_CONTEXT');
  });

  it('proves generated choice prompt still reflects the snapshot even after stores are mutated', () => {
    const { useInventoryStore } = jest.requireMock('@/state/inventoryStore');
    const { useCharacterStore } = jest.requireMock('@/state/characterStore');

    const world = createMockWorld({
      id: 'world-1',
      name: 'Test World',
    });

    const snapshot = {
      sessionId: 'session-1',
      worldId: 'world-1',
      characterId: 'char-frozen',
      turnIndex: 2,
      segments: [],
      decisions: [],
      character: {
        id: 'char-frozen',
        name: 'FrozenCharacter',
        worldId: 'world-1',
        level: 3,
        skills: [{ id: 's-frozen', characterId: 'char-frozen', name: 'Stealth', level: 1 }],
      },
      inventory: [
        {
          id: 'item-frozen',
          name: 'Frozen Shield',
          characterId: 'char-frozen',
          quantity: 1,
          equipped: true,
        },
      ],
      worldThreads: [],
      worldState: undefined,
      loreContext: '\n\nFROZEN_LORE',
      npcs: [{ id: 'npc-frozen', name: 'Frozen NPC', worldId: 'world-1' }],
      conditions: [],
      endedSessions: {},
    };

    // Mutate live stores AFTER snapshot is assembled
    useInventoryStore.getState.mockReturnValue({
      getCharacterItems: jest.fn(() => [
        { id: 'item-mutated', name: 'Mutated Broadsword', equipped: false },
      ]),
    });
    useCharacterStore.getState.mockReturnValue({
      characters: {
        'char-frozen': {
          id: 'char-frozen',
          name: 'MutatedName',
          skills: [{ name: 'MutatedSkill', level: 99 }],
        },
      },
    });

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['char-frozen'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      snapshot: snapshot as unknown as import('@/types/turnResolver.types').SessionSnapshot,
    });

    // Prompt MUST reflect the snapshot values, NOT the mutated live stores
    expect(prompt).toContain('FrozenCharacter');
    expect(prompt).not.toContain('MutatedName');
    expect(prompt).toContain('FROZEN_LORE');
  });
});
