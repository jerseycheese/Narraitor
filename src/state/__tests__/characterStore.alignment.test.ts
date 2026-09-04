import { useCharacterStore } from '../characterStore';
import type { StoreCharacter } from '../characterStore.types';

const makeCharacter = (id: string, alignment?: number): StoreCharacter =>
  ({
    id,
    name: 'Test Hero',
    description: '',
    worldId: 'world-1',
    level: 1,
    alignment,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
    isPlayer: true,
    status: { conditions: [] },
    inventory: { characterId: id, items: [], capacity: 10, categories: [], itemOrder: [] },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as StoreCharacter;

describe('characterStore.applyAlignmentShift', () => {
  beforeEach(() => {
    useCharacterStore.setState({ characters: {}, entities: {}, error: null });
  });

  it('shifts from undefined alignment as if neutral (0)', () => {
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1') },
    }));

    useCharacterStore.getState().applyAlignmentShift('char-1', -8);

    expect(useCharacterStore.getState().characters['char-1'].alignment).toBe(-8);
  });

  it('accumulates across shifts and clamps at both ends', () => {
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1', 95) },
    }));

    useCharacterStore.getState().applyAlignmentShift('char-1', 12);
    expect(useCharacterStore.getState().characters['char-1'].alignment).toBe(100);

    useCharacterStore.getState().applyAlignmentShift('char-1', -250);
    expect(useCharacterStore.getState().characters['char-1'].alignment).toBe(-100);
  });

  it('no-ops for unknown characters and non-finite or zero deltas', () => {
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1', 5) },
    }));

    useCharacterStore.getState().applyAlignmentShift('missing', 10);
    useCharacterStore.getState().applyAlignmentShift('char-1', Number.NaN);
    useCharacterStore.getState().applyAlignmentShift('char-1', 0);

    expect(useCharacterStore.getState().characters['char-1'].alignment).toBe(5);
  });
});
