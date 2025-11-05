/**
 * Test helpers for loreStore tests
 * Provides reusable utilities for testing lore functionality
 */

import { renderHook, act, RenderHookResult } from '@testing-library/react';
import { useLoreStore } from '../loreStore';

type LoreStoreResult = RenderHookResult<ReturnType<typeof useLoreStore>, unknown>['result'];

/**
 * Sets up a fresh lore store and clears test worlds
 */
export function setupLoreStore(worldIds: string[] = ['test-world', 'world-1', 'world-2']) {
  const { result } = renderHook(() => useLoreStore());
  act(() => {
    worldIds.forEach(worldId => {
      result.current.clearFacts(worldId);
    });
  });
  return result;
}

/**
 * Adds a fact to the store using act
 */
export function addFact(
  result: LoreStoreResult,
  key: string,
  value: string,
  category: string,
  source: 'manual' | 'narrative' | 'ai-generated',
  worldId: string
) {
  act(() => {
    result.current.addFact(key, value, category, source, worldId);
  });
}

/**
 * Adds multiple facts to the store
 */
export function addMultipleFacts(
  result: LoreStoreResult,
  facts: Array<{
    key: string;
    value: string;
    category: string;
    source: 'manual' | 'narrative' | 'ai-generated';
    worldId: string;
  }>
) {
  act(() => {
    facts.forEach(fact => {
      result.current.addFact(fact.key, fact.value, fact.category, fact.source, fact.worldId);
    });
  });
}

/**
 * Creates sample character facts
 */
export function createCharacterFacts(worldId = 'test-world') {
  return [
    { key: 'hero_name', value: 'Lyra', category: 'characters', source: 'manual' as const, worldId },
    { key: 'villain_name', value: 'Dark Lord', category: 'characters', source: 'narrative' as const, worldId }
  ];
}

/**
 * Creates sample location facts
 */
export function createLocationFacts(worldId = 'test-world') {
  return [
    { key: 'tavern_location', value: 'Prancing Pony', category: 'locations', source: 'manual' as const, worldId },
    { key: 'castle_location', value: 'Dark Tower', category: 'locations', source: 'narrative' as const, worldId }
  ];
}

/**
 * Creates sample rule facts
 */
export function createRuleFacts(worldId = 'test-world') {
  return [
    { key: 'magic_rule', value: 'Magic requires sacrifice', category: 'rules', source: 'manual' as const, worldId }
  ];
}
