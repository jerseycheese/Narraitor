/**
 * Tests for LoreStore Basic Operations
 *
 * Verifies adding facts, retrieving by category, and clearing facts.
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import {
  setupLoreStore,
  addFact,
  addMultipleFacts,
  createCharacterFacts,
  createLocationFacts
} from './loreStore.testHelpers';

describe('LoreStore - Basic Operations', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  test('should add a fact', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      result.current.addFact(
        'hero_name',
        'Lyra Starweaver',
        'characters',
        'manual',
        'test-world'
      );
    });

    const facts = result.current.getFacts({ worldId: 'test-world' });
    expect(facts).toHaveLength(1);
    expect(facts[0].key).toBe('hero_name');
    expect(facts[0].value).toBe('Lyra Starweaver');
    expect(facts[0].category).toBe('characters');
  });

  test('should get facts by category', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      result.current.addFact('hero_name', 'Lyra', 'characters', 'manual', 'test-world');
      result.current.addFact('tavern_location', 'Prancing Pony', 'locations', 'manual', 'test-world');
      result.current.addFact('villain_name', 'Dark Lord', 'characters', 'narrative', 'test-world');
    });

    const characterFacts = result.current.getFacts({
      worldId: 'test-world',
      category: 'characters'
    });

    expect(characterFacts).toHaveLength(2);
    expect(characterFacts.every(f => f.category === 'characters')).toBe(true);
  });

  test('should clear facts for a world', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      result.current.addFact('fact1', 'value1', 'characters', 'manual', 'world-1');
      result.current.addFact('fact2', 'value2', 'locations', 'manual', 'world-2');
    });

    act(() => {
      result.current.clearFacts('world-1');
    });

    expect(result.current.getFacts({ worldId: 'world-1' })).toHaveLength(0);
    expect(result.current.getFacts({ worldId: 'world-2' })).toHaveLength(1);
  });
});
