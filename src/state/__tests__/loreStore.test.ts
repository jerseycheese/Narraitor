/**
 * Tests for lore store
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';

describe('LoreStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useLoreStore());
    act(() => {
      result.current.clearFacts('test-world');
    });
  });

  describe('Basic Operations', () => {
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

  describe('AI Context', () => {
    test('should generate lore context for AI', () => {
      const { result } = renderHook(() => useLoreStore());

      act(() => {
        result.current.addFact('hero_name', 'Lyra', 'characters', 'manual', 'test-world');
        result.current.addFact('magic_rule', 'Magic requires sacrifice', 'rules', 'manual', 'test-world');
      });

      const context = result.current.getLoreContext('test-world');
      
      expect(context.factCount).toBe(2);
      expect(context.facts).toContain('characters: hero_name = Lyra');
      expect(context.facts).toContain('rules: magic_rule = Magic requires sacrifice');
    });

    test('should limit context size', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add more facts than the limit
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addFact(
            `fact_${i}`,
            `value_${i}`,
            'characters',
            'manual',
            'test-world'
          );
        }
      });

      const context = result.current.getLoreContext('test-world', 5);
      expect(context.factCount).toBe(5);
    });
  });

  describe('Fact Extraction', () => {
    test('should extract character names from text', () => {
      const { result } = renderHook(() => useLoreStore());

      const narrative = 'Sir Marcus the Brave led the charge. Lady Elena watched from the tower.';

      act(() => {
        result.current.extractFactsFromText(narrative, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      expect(facts.length).toBeGreaterThan(0);
      
      const characterFacts = facts.filter(f => f.category === 'characters');
      expect(characterFacts.length).toBeGreaterThan(0);
    });

    test('should extract location names from text', () => {
      const { result } = renderHook(() => useLoreStore());

      const narrative = 'They traveled from Riverdale to the Dark Forest.';

      act(() => {
        result.current.extractFactsFromText(narrative, 'test-world');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const locationFacts = facts.filter(f => f.category === 'locations');
      
      expect(locationFacts.length).toBeGreaterThan(0);
      expect(locationFacts.some(f => f.value === 'Riverdale')).toBe(true);
    });

    test('should avoid duplicate facts', () => {
      const { result } = renderHook(() => useLoreStore());

      const narrative = 'Sir Marcus fought bravely. Sir Marcus won the battle.';

      act(() => {
        result.current.extractFactsFromText(narrative, 'test-world');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const marcusFacts = facts.filter(f => f.value.includes('Marcus'));
      
      expect(marcusFacts).toHaveLength(1);
    });
  });
});