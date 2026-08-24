import { useCharacterStore } from '../characterStore';
import type { Character } from '../characterStore.types';

const makeCharacter = (id: string, conditions: string[] = []): Character =>
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
  }) as Character;

const conditionsOf = (id: string) => useCharacterStore.getState().characters[id].status.conditions;

describe('characterStore conditions', () => {
  beforeEach(() => {
    useCharacterStore.setState({ characters: {}, entities: {}, error: null });
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1', ['shaken']) },
    }));
  });

  it('addCondition appends a condition the character now carries and does not repeat one they already have', () => {
    useCharacterStore.getState().addCondition('char-1', 'gashed left forearm');
    useCharacterStore.getState().addCondition('char-1', ' Gashed Left Forearm ');

    expect(conditionsOf('char-1')).toEqual(['shaken', 'gashed left forearm']);
  });

  it('removeCondition clears a condition by text, case-insensitively', () => {
    useCharacterStore.getState().removeCondition('char-1', 'Shaken');

    expect(conditionsOf('char-1')).toEqual([]);
  });

  it('no-ops for unknown characters and empty text', () => {
    useCharacterStore.getState().addCondition('missing', 'gashed left forearm');
    useCharacterStore.getState().addCondition('char-1', '   ');
    useCharacterStore.getState().removeCondition('char-1', 'not there');

    expect(conditionsOf('char-1')).toEqual(['shaken']);
  });
});
