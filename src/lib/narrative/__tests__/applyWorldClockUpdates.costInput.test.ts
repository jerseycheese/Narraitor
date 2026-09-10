import { buildCostInput } from '../applyWorldClockUpdates';
import { useCharacterStore } from '@/state/characterStore';
import type { StoreCharacter } from '@/state/characterStore.types';
import type { NarrativeMetadata, NarrativeSegment } from '@/types/narrative.types';

const makeCharacter = (id: string, conditions: string[] = []): StoreCharacter =>
  ({
    id,
    name: 'Jamie Holt',
    description: '',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
    isPlayer: true,
    status: { conditions },
    inventory: { characterId: id, items: [], capacity: 10, categories: [], itemOrder: [] },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as StoreCharacter;

const makeSegment = (metadataOverrides: Partial<NarrativeMetadata> = {}): NarrativeSegment => ({
  id: 'seg-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  content: 'Something happens.',
  type: 'scene',
  metadata: { tags: [], ...metadataOverrides },
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('buildCostInput', () => {
  beforeEach(() => {
    useCharacterStore.setState({ characters: {}, entities: {}, error: null });
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1', ['shaken']) },
    }));
  });

  it('passes segment decision id, text, and outcome when present', () => {
    const segment = makeSegment({
      causedByDecisionId: 'decision-42',
      causedByDecisionText: 'Confront the lurking figure',
      decisionOutcome: 'failure',
    });

    const costInput = buildCostInput('char-1', segment);

    expect(costInput).toEqual({
      conditions: ['shaken'],
      itemsLost: [],
      decision: {
        id: 'decision-42',
        text: 'Confront the lurking figure',
        outcome: 'failure',
      },
    });
  });

  it('falls back to empty string when causedByDecisionText is absent', () => {
    const segment = makeSegment({
      causedByDecisionId: 'decision-42',
      decisionOutcome: 'mixed',
    });

    const costInput = buildCostInput('char-1', segment);

    expect(costInput?.decision).toEqual({
      id: 'decision-42',
      text: '',
      outcome: 'mixed',
    });
  });

  it('leaves decision undefined when segment has no causedByDecisionId', () => {
    const segment = makeSegment({
      itemsLost: [{ name: 'rusty shovel', lossReason: 'destroyed' }],
    });

    const costInput = buildCostInput('char-1', segment);

    expect(costInput).toEqual({
      conditions: ['shaken'],
      itemsLost: ['rusty shovel'],
      decision: undefined,
    });
  });

  it('returns undefined when character is not found', () => {
    const segment = makeSegment({ causedByDecisionId: 'decision-1' });
    expect(buildCostInput('unknown-char', segment)).toBeUndefined();
  });
});
