import { buildChoicePrompt } from '../choiceGenerator.prompt';
import type { NarrativeContext } from '@/types/narrative.types';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { playerDecisionTracker } from '../playerDecisionTracker';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { RequestBudget, ComponentPriority } from '@/lib/promptContext/tokenBudgetManager';

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

  it('truncates lore context to the budget when a budget is supplied', () => {
    const bigLoreContext = `\n\nEstablished World Facts:\n${new Array(2000).fill('word').join(' ')}\nEND_MARKER`;
    (getLoreContextForPrompt as jest.Mock).mockReturnValueOnce(bigLoreContext);

    const world = createMockWorld({ id: 'world-1' });
    const budget = new RequestBudget(
      [{ componentId: 'lore-context', priority: ComponentPriority.MEDIUM, limit: 20 }],
      20,
      true
    );

    const prompt = buildChoicePrompt({
      world,
      worldId: 'world-1',
      narrativeContext,
      characterIds: ['char-1'],
      sessionId: 'session-1',
      includeDecisionHistory: false,
      budget,
    });

    expect(prompt).toContain('Established World Facts:');
    expect(prompt).not.toContain('END_MARKER');
  });
});
