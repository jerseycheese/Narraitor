/**
 * Test to demonstrate category imbalance issue
 * See issue #955 for context
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import { setupLoreStore } from './loreStore.testHelpers';

describe('LoreStore - Category Balance (Issue #955)', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  test('demonstrates imbalance with character-heavy mixed importance', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      // Realistic scenario: character-heavy world with mixed importance
      // This simulates a social/intrigue-focused narrative

      // 5 high-importance main characters
      for (let i = 0; i < 5; i++) {
        const id = result.current.addFact(
          `main_char_${i}`,
          `Main Character ${i}`,
          'characters',
          'manual',
          'test-world',
          'session-1'
        );
        result.current.updateFact(id, {
          visibility: 'world-shared',
          metadata: { importance: 'high' }
        });
      }

      // 10 medium-importance NPCs (shopkeepers, guards, etc.)
      for (let i = 0; i < 10; i++) {
        const id = result.current.addFact(
          `npc_${i}`,
          `NPC ${i}`,
          'characters',
          'manual',
          'test-world',
          'session-1'
        );
        result.current.updateFact(id, {
          visibility: 'world-shared',
          metadata: { importance: 'medium' }
        });
      }

      // 3 high-importance world rules
      for (let i = 0; i < 3; i++) {
        const id = result.current.addFact(
          `rule_${i}`,
          `Critical world rule ${i}`,
          'rules',
          'manual',
          'test-world',
          'session-1'
        );
        result.current.updateFact(id, {
          visibility: 'world-shared',
          metadata: { importance: 'high' }
        });
      }

      // 2 high-importance locations
      for (let i = 0; i < 2; i++) {
        const id = result.current.addFact(
          `loc_${i}`,
          `Key Location ${i}`,
          'locations',
          'manual',
          'test-world',
          'session-1'
        );
        result.current.updateFact(id, {
          visibility: 'world-shared',
          metadata: { importance: 'high' }
        });
      }
    });

    const context = result.current.getLoreContext('test-world', 'session-1', 20);

    // Analyze distribution
    const distribution = { characters: 0, locations: 0, events: 0, rules: 0 };
    context.facts.forEach(fact => {
      const category = fact.split(':')[0] as keyof typeof distribution;
      if (category in distribution) {
        distribution[category]++;
      }
    });

    console.log('\n=== Category Imbalance Demonstration (Issue #955) ===');
    console.log('Input: 5 high chars + 10 med chars, 3 high rules, 2 high locs');
    console.log('Output distribution:', distribution);
    console.log('Percentages:', {
      characters: `${(distribution.characters / 20 * 100).toFixed(0)}%`,
      locations: `${(distribution.locations / 20 * 100).toFixed(0)}%`,
      rules: `${(distribution.rules / 20 * 100).toFixed(0)}%`,
    });
    console.log('Issue: Characters at 75%, medium NPCs crowding out rules');
    console.log('=====================================================\n');

    // Document the issue
    expect(context.factCount).toBe(20);
    expect(distribution.characters).toBe(15); // 75% - too high
    expect(distribution.rules).toBe(3);       // Only 15% - should be higher
    expect(distribution.locations).toBe(2);   // Only 10%
  });
});
