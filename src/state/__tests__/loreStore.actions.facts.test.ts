import { createLoreFactActions } from '../loreStore.actions.facts';
import type { LoreStore } from '../loreStore';

describe('createLoreFactActions', () => {
  it('sets an error when addFact receives an invalid key', () => {
    const set = jest.fn();
    const store = {
      facts: {},
      factHistory: {},
      validateFact: jest.fn(() => true),
      validateKey: jest.fn(() => false),
      validateFactUniqueness: jest.fn(() => true),
      create: jest.fn(),
    } as unknown as LoreStore;

    const get = jest.fn(() => store);
    const actions = createLoreFactActions(set, get);

    actions.addFact('bad key', 'value', 'characters', 'manual', 'world-1');

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          title: 'Invalid Lore Key',
        }),
      })
    );
  });

  it('creates a fact when validation passes', () => {
    const set = jest.fn();
    const store = {
      facts: {},
      factHistory: {},
      validateFact: jest.fn(() => true),
      validateKey: jest.fn(() => true),
      validateFactUniqueness: jest.fn(() => true),
      create: jest.fn(() => 'fact-1'),
    } as unknown as LoreStore;

    const get = jest.fn(() => store);
    const actions = createLoreFactActions(set, get);

    const result = actions.addFact('key', 'value', 'characters', 'manual', 'world-1');

    expect(result).toBe('fact-1');
    expect(store.create).toHaveBeenCalled();
  });
});
