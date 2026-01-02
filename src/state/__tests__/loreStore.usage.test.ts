/**
 * LoreStore usage tracking tests
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';

describe('LoreStore - Usage Tracking', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useLoreStore());
    act(() => {
      result.current.reset();
    });
  });

  test('records lore usage events and increments usage counts', () => {
    const { result } = renderHook(() => useLoreStore());
    let factId = '';

    act(() => {
      factId = result.current.addFact('hero_name', 'Lyra', 'characters', 'manual', 'world-1');
    });

    act(() => {
      result.current.recordLoreUsage({
        worldId: 'world-1',
        sessionId: 'session-1',
        factIds: [factId],
        source: 'narrative'
      });
    });

    const stats = result.current.loreUsage[factId];
    expect(stats).toBeDefined();
    expect(stats.usageCount).toBe(1);
    expect(result.current.loreUsageEvents[0]).toMatchObject({
      worldId: 'world-1',
      sessionId: 'session-1',
      eventType: 'context',
      source: 'narrative'
    });
  });

  test('records lore mentions based on fact values and aliases', () => {
    const { result } = renderHook(() => useLoreStore());
    let mentionId = '';
    let shortId = '';
    let partialId = '';

    act(() => {
      mentionId = result.current.addFact('mentor', 'Sir Gareth', 'characters', 'manual', 'world-1');
      shortId = result.current.addFact('short', 'Al', 'characters', 'manual', 'world-1');
      partialId = result.current.addFact('partial', 'Dan', 'characters', 'manual', 'world-1');
      result.current.setAliases(mentionId, ['Gareth']);
    });

    act(() => {
      result.current.recordLoreMentions({
        worldId: 'world-1',
        sessionId: 'session-1',
        factIds: [mentionId, shortId, partialId],
        responseText: 'Gareth nods and steps forward. Danger looms nearby.',
        source: 'narrative'
      });
    });

    expect(result.current.loreUsage[mentionId]?.mentionCount).toBe(1);
    expect(result.current.loreUsage[shortId]?.mentionCount ?? 0).toBe(0);
    expect(result.current.loreUsage[partialId]?.mentionCount ?? 0).toBe(0);
    expect(result.current.loreUsageEvents[0]?.factIds).toEqual([mentionId]);
  });

  test('clears usage data for a world', () => {
    const { result } = renderHook(() => useLoreStore());
    let world1Fact = '';
    let world2Fact = '';

    act(() => {
      world1Fact = result.current.addFact('hero', 'Lyra', 'characters', 'manual', 'world-1');
      world2Fact = result.current.addFact('villain', 'Drake', 'characters', 'manual', 'world-2');
    });

    act(() => {
      result.current.recordLoreUsage({
        worldId: 'world-1',
        factIds: [world1Fact],
        source: 'narrative'
      });
      result.current.recordLoreUsage({
        worldId: 'world-2',
        factIds: [world2Fact],
        source: 'choices'
      });
    });

    act(() => {
      result.current.clearLoreUsage('world-1');
    });

    expect(result.current.loreUsage[world1Fact]).toBeUndefined();
    expect(result.current.loreUsage[world2Fact]).toBeDefined();
    expect(result.current.loreUsageEvents.every((event) => event.worldId !== 'world-1')).toBe(true);
  });
});
