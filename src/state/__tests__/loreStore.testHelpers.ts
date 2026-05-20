/**
 * Test helpers for loreStore tests
 * Provides reusable utilities for testing lore functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';

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
