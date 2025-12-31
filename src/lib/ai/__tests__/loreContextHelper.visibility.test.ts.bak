/**
 * Lore Context Helper Visibility Tests
 * Issue #946: Hybrid lore scoping
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '@/state/loreStore';
import { getLoreContextForPrompt } from '../loreContextHelper';

describe('loreContextHelper - Visibility', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useLoreStore());
    act(() => {
      result.current.reset();
    });
  });

  test('getLoreContextForPrompt filters by sessionId', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      const id1 = result.current.addFact('private', 'val1', 'characters', 'manual', 'world-1', 'session-1');
      result.current.updateFact(id1, { visibility: 'session-private' });

      const id2 = result.current.addFact('shared', 'val2', 'characters', 'manual', 'world-1');
      result.current.updateFact(id2, { visibility: 'world-shared' });
    });

    const context = getLoreContextForPrompt('world-1', 'session-1');

    expect(context).toContain('private');
    expect(context).toContain('shared');
  });

  test('getLoreContextForPrompt excludes other sessions private facts', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      const id1 = result.current.addFact('session2-private', 'val', 'characters', 'manual', 'world-1', 'session-2');
      result.current.updateFact(id1, { visibility: 'session-private' });
    });

    const context = getLoreContextForPrompt('world-1', 'session-1');

    expect(context).not.toContain('session2-private');
  });
});
