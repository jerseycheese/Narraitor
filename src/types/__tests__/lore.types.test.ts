/**
 * Lore Types Tests
 * Issue #946: Hybrid lore scoping
 */

import type { LoreFact } from '../lore.types';

describe('LoreFact', () => {
  test('accepts visibility field', () => {
    const fact: LoreFact = {
      id: 'test-id',
      category: 'characters',
      key: 'test_key',
      value: 'test value',
      aliases: [],
      source: 'manual',
      worldId: 'world-1',
      visibility: 'session-private',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    expect(fact.visibility).toBe('session-private');
  });
});
