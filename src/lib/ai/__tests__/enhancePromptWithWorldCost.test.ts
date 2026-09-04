import { enhancePromptWithWorldCost } from '../narrativeGenerator.prompt';
import { worldCostBlock } from '@/lib/promptTemplates/templates/narrative/worldCostBlock';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useCharacterStore } from '@/state/characterStore';
import type { StoreCharacter } from '@/state/characterStore.types';

jest.mock('@/lib/featureFlags');

const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

const makeCharacter = (id: string, conditions: string[]): StoreCharacter =>
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

describe('worldCostBlock', () => {
  it('names what the character carries and says a landing costs something recordable', () => {
    const block = worldCostBlock(['gashed left forearm', 'discredited before the council']);

    expect(block).toContain('gashed left forearm; discredited before the council');
    expect(block).toContain('itemsLost');
    expect(block).toContain('takes nothing has not landed');
  });

  it('still states the rule when the character carries nothing', () => {
    expect(worldCostBlock([])).toContain('(nothing yet)');
  });
});

describe('enhancePromptWithWorldCost', () => {
  beforeEach(() => {
    useCharacterStore.setState({ characters: {}, entities: {}, error: null });
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1', ['gashed left forearm']) },
    }));
  });

  it('with the flag on, appends the block with the character\'s conditions', () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    const prompt = enhancePromptWithWorldCost('BASE', ['char-1']);

    expect(prompt.startsWith('BASE')).toBe(true);
    expect(prompt).toContain('gashed left forearm');
    expect(prompt).toContain('takes nothing has not landed');
  });

  it('with the flag off, returns the prompt byte-identical', () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    expect(enhancePromptWithWorldCost('BASE', ['char-1'])).toBe('BASE');
  });

  it('with no character, returns the prompt byte-identical', () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    expect(enhancePromptWithWorldCost('BASE', [])).toBe('BASE');
  });
});
