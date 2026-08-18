/**
 * Integration tests for the runtime continuity guardrail (#409/#412).
 *
 * Seeds a contradiction — an NPC whose trust was tanked via the consequence
 * path — and proves the guardrail catches a warm portrayal of her in the
 * generated segment and corrects it before it would reach the player.
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { CONTINUITY_CORRECTION_HEADER } from '@/lib/lore/continuityGuardrail';
import { useContinuityStore } from '@/state/continuityStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { useLoreStore } from '@/state/loreStore';
import { extractStructuredLore } from '../structuredLoreExtractor';
import { setupDecisionConsequencesMocks } from './narrativeGenerator.decisionConsequences.testHelpers';
import type { AIClient } from '../types';
import type { NarrativeGenerationRequest } from '@/types/narrative.types';

// Mock the store modules (same set as the sibling decision-consequences tests)
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/aiContextStore', () => ({
  useAiContextStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: jest.fn()
  }
}));
jest.mock('../playerDecisionTracker');
jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  getNarrativeTemplate: jest.fn()
}));
jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn(),
  checkAndRecordLoreMentions: jest.fn()
}));
jest.mock('../structuredLoreExtractor', () => ({
  extractStructuredLore: jest.fn()
}));
jest.mock('../toneSettingsGuidance', () => ({
  getDetailedToneInstructions: jest.fn()
}));
jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn()
  }
}));

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

const miraFact = {
  id: 'fact-mira',
  category: 'characters' as const,
  key: 'world-1:character_mira',
  value: 'Mira - a wary herbalist',
  aliases: ['the herbalist'],
  source: 'narrative' as const,
  worldId: 'world-1',
  visibility: 'world-shared' as const,
  metadata: { description: 'A wary herbalist who keeps to herself.' },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const CONTRADICTORY_PROSE =
  'Mira beams at you and embraces you warmly, delighted to see her old friend again.';
const CORRECTED_PROSE =
  'Mira watches you from behind the counter, her expression closed, one hand resting near the door latch.';
const CLEAN_PROSE =
  'Mira eyes you warily and gestures toward the shelf without a word.';

interface RoutedClient extends AIClient {
  generateContent: jest.Mock;
}

/**
 * Routes by prompt content rather than call order because generateSegment
 * makes additional internal AI calls (metadata analysis, language
 * complexity) that must not consume queued responses.
 */
const createRoutedClient = (
  narrativeContent: string,
  correctionContent: string
): RoutedClient => ({
  generateContent: jest.fn(async (prompt: string) => {
    if (prompt.includes(CONTINUITY_CORRECTION_HEADER)) {
      return {
        content: correctionContent,
        finishReason: 'STOP',
        promptTokens: 10,
        completionTokens: 10,
      };
    }
    return {
      content: narrativeContent,
      finishReason: 'STOP',
      promptTokens: 100,
      completionTokens: 200,
    };
  }),
});

const correctionPromptsOf = (client: RoutedClient): string[] =>
  client.generateContent.mock.calls
    .map(([prompt]: [string]) => prompt)
    .filter((prompt: string) => prompt.includes(CONTINUITY_CORRECTION_HEADER));

const request: NarrativeGenerationRequest = {
  worldId: 'world-1',
  sessionId: 'session-1',
  characterIds: ['char-1'],
};

describe('NarrativeGenerator - continuity guardrail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useContinuityStore.getState().clear();

    setupDecisionConsequencesMocks([]);

    // Seed the contradiction source: Mira's trust was tanked by a recent
    // decision (worldStore.npcRelationships is what the consequence path
    // writes to).
    (useWorldStore.getState as jest.Mock).mockImplementation(() => ({
      worlds: { 'world-1': mockWorld },
      worldStates: {},
      currentWorldId: 'world-1',
      error: null,
      loading: false,
      getWorldState: jest.fn(() => ({
        npcRelationships: {
          'npc-mira': {
            trust: 5,
            sentiment: -80,
            lastInteraction: '2025-01-01T00:00:00.000Z',
            sessionId: 'session-1',
          },
        },
      })),
    }));

    (useNPCStore.getState as jest.Mock).mockImplementation(() => ({
      getNPCsByWorld: jest
        .fn()
        .mockReturnValue([{ id: 'npc-mira', name: 'Mira', worldId: 'world-1' }]),
      getById: jest.fn(),
      createNPC: jest.fn(),
      updateNPC: jest.fn(),
    }));

    (useLoreStore.getState as jest.Mock).mockReturnValue({
      getFacts: jest.fn().mockReturnValue([miraFact]),
      getLoreContext: jest.fn().mockReturnValue({ factIds: [] }),
      recordLoreMentions: jest.fn(),
      recordLoreUsage: jest.fn(),
      addStructuredLore: jest.fn(),
    });
  });

  it('catches a seeded contradiction (tanked trust written as warm) and corrects it', async () => {
    const client = createRoutedClient(CONTRADICTORY_PROSE, CORRECTED_PROSE);
    const generator = new NarrativeGenerator(client);

    const result = await generator.generateSegment(request);

    // The contradictory draft never reaches the caller; the corrected prose does.
    expect(result.content).toBe(CORRECTED_PROSE);

    // Exactly one corrective AI call, naming the offending NPC.
    const correctionPrompts = correctionPromptsOf(client);
    expect(correctionPrompts).toHaveLength(1);
    expect(correctionPrompts[0]).toContain('Mira');
    expect(correctionPrompts[0]).toContain('embraces you warmly');

    // Segment metadata records the outcome for persistence via addSegment.
    expect(result.metadata.continuity).toEqual({
      status: 'corrected',
      issues: [{ type: 'relationship-tone', entity: 'Mira' }],
    });

    // Lore extraction ran on the corrected prose, not the contradicted draft.
    expect(extractStructuredLore).toHaveBeenCalledWith(
      CORRECTED_PROSE,
      expect.anything(),
      expect.anything()
    );

    // DevTools feed got the full validation record.
    const recorded = useContinuityStore.getState().results;
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      status: 'corrected',
      worldId: 'world-1',
      sessionId: 'session-1',
    });
    expect(recorded[0].issues[0]).toMatchObject({
      type: 'relationship-tone',
      entity: 'Mira',
    });
    expect(typeof recorded[0].detectionMs).toBe('number');
    expect(typeof recorded[0].correctionMs).toBe('number');

    // Prevention layer: the generation prompt itself carries the expectations.
    const narrativePrompt = client.generateContent.mock.calls[0][0];
    expect(narrativePrompt).toContain('CONTINUITY REQUIREMENTS');
    expect(narrativePrompt).toContain('Mira');
  });

  it('makes no correction call for a clean segment', async () => {
    const client = createRoutedClient(CLEAN_PROSE, CORRECTED_PROSE);
    const generator = new NarrativeGenerator(client);

    const result = await generator.generateSegment(request);

    expect(correctionPromptsOf(client)).toHaveLength(0);
    expect(result.metadata.continuity).toEqual({ status: 'clean' });

    const recorded = useContinuityStore.getState().results;
    expect(recorded).toHaveLength(1);
    expect(recorded[0].status).toBe('clean');
  });

  it('flags the segment but keeps the original when correction does not improve it', async () => {
    const client = createRoutedClient(CONTRADICTORY_PROSE, CONTRADICTORY_PROSE);
    const generator = new NarrativeGenerator(client);

    const result = await generator.generateSegment(request);

    expect(result.content).toContain('embraces you warmly');
    expect(result.metadata.continuity?.status).toBe('flagged');

    const recorded = useContinuityStore.getState().results;
    expect(recorded).toHaveLength(1);
    expect(recorded[0].status).toBe('flagged');
    expect(recorded[0].remainingIssues).toHaveLength(1);
  });

  it('activates on a ledger-only contract and hands topics to the extractor', async () => {
    // No relationships and no dead/destroyed lore: before the ledger this
    // contract was vacuous and the guardrail sat out the turn.
    (useWorldStore.getState as jest.Mock).mockImplementation(() => ({
      worlds: { 'world-1': mockWorld },
      worldStates: {},
      currentWorldId: 'world-1',
      error: null,
      loading: false,
      getWorldState: jest.fn(() => ({ npcRelationships: {} })),
    }));
    (useLoreStore.getState as jest.Mock).mockReturnValue({
      getFacts: jest.fn().mockReturnValue([
        {
          ...miraFact,
          id: 'fact-debt',
          category: 'events' as const,
          key: 'world-1:event_debt',
          value: 'Aunt Carol says Old Man Rowan paid off the mortgage years ago.',
          aliases: [],
          metadata: {
            importance: 'high' as const,
            continuity: { kind: 'assertion' as const, topic: 'mill debt', speaker: 'Aunt Carol' },
          },
        },
      ]),
      getLoreContext: jest.fn().mockReturnValue({ factIds: [] }),
      recordLoreMentions: jest.fn(),
      recordLoreUsage: jest.fn(),
      addStructuredLore: jest.fn(),
    });
    const client = createRoutedClient(CLEAN_PROSE, CORRECTED_PROSE);
    const generator = new NarrativeGenerator(client);

    const result = await generator.generateSegment(request);

    const generationPrompt = client.generateContent.mock.calls[0][0] as string;
    expect(generationPrompt).toContain('CONTINUITY REQUIREMENTS');
    expect(generationPrompt).toContain('mill debt (Aunt Carol)');
    expect(result.metadata.continuity).toEqual({ status: 'clean' });
    expect(extractStructuredLore).toHaveBeenCalledWith(
      CLEAN_PROSE,
      expect.anything(),
      { continuityTopics: ['mill debt'], playerCharacterName: 'Hero' }
    );
  });
});
