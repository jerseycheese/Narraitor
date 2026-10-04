import React from 'react';
import { act, render, screen } from '@testing-library/react';
import GameSessionTestHarness from '../page';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

jest.mock('@/state/worldStore', () => {
  const { create } = jest.requireActual('zustand');
  return { useWorldStore: create(() => ({ worlds: {} })) };
});

jest.mock('@/state/characterStore', () => {
  const { create } = jest.requireActual('zustand');
  return { useCharacterStore: create(() => ({ characters: {} })) };
});

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: { getState: () => ({}) },
}));
jest.mock('@/state/narrativeStore', () => ({ useNarrativeStore: {} }));
jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: () => ({ npcs: { 'npc-marta': {}, 'npc-guard-bren': {} } }),
  },
}));
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: () => ({
      clearCharacterInventory: jest.fn(),
      addItem: jest.fn(),
    }),
  },
}));
jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: class {
    info() {}
  },
}));
jest.mock('@/components/GameSession/GameSession', () => ({
  __esModule: true,
  default: function MockGameSession() {
    const world = useWorldStore((state) => state.worlds['world-1']);
    const character = useCharacterStore(
      (state) => state.characters['test-character-123']
    );
    return (
      <div className="mock-game-session">
        {world && character
          ? 'Test session ready'
          : 'World or character missing'}
      </div>
    );
  },
}));

function delayedHydration() {
  let isHydrated = false;
  const listeners = new Set<() => void>();
  return {
    persist: {
      hasHydrated: () => isHydrated,
      onFinishHydration: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    finish: () => {
      isHydrated = true;
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
}

describe('game session harness hydration', () => {
  it.each(['world', 'character'])(
    'keeps its test records after %s hydrates last',
    (lastStore) => {
      useWorldStore.setState({ worlds: {} });
      useCharacterStore.setState({ characters: {} });
      const worldHydration = delayedHydration();
      const characterHydration = delayedHydration();
      Object.assign(useWorldStore, { persist: worldHydration.persist });
      Object.assign(useCharacterStore, { persist: characterHydration.persist });

      render(<GameSessionTestHarness />);
      act(() => {
        if (lastStore === 'world') {
          useCharacterStore.setState({ characters: {} });
          characterHydration.finish();
          useWorldStore.setState({ worlds: {} });
          worldHydration.finish();
        } else {
          useWorldStore.setState({ worlds: {} });
          worldHydration.finish();
          useCharacterStore.setState({ characters: {} });
          characterHydration.finish();
        }
      });

      expect(screen.getByText('Test session ready')).toBeInTheDocument();
      expect(worldHydration.listenerCount()).toBe(0);
      expect(characterHydration.listenerCount()).toBe(0);
    }
  );

  it('seeds immediately when both stores already hydrated', () => {
    useWorldStore.setState({ worlds: {} });
    useCharacterStore.setState({ characters: {} });
    const worldHydration = delayedHydration();
    const characterHydration = delayedHydration();
    worldHydration.finish();
    characterHydration.finish();
    Object.assign(useWorldStore, { persist: worldHydration.persist });
    Object.assign(useCharacterStore, { persist: characterHydration.persist });

    render(<GameSessionTestHarness />);

    expect(screen.getByText('Test session ready')).toBeInTheDocument();
  });

  it('removes pending hydration listeners when the harness unmounts', () => {
    const worldHydration = delayedHydration();
    const characterHydration = delayedHydration();
    Object.assign(useWorldStore, { persist: worldHydration.persist });
    Object.assign(useCharacterStore, { persist: characterHydration.persist });
    const { unmount } = render(<GameSessionTestHarness />);
    expect(worldHydration.listenerCount()).toBe(1);
    expect(characterHydration.listenerCount()).toBe(1);
    unmount();
    expect(worldHydration.listenerCount()).toBe(0);
    expect(characterHydration.listenerCount()).toBe(0);
  });
});
