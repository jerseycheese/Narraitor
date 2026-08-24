/**
 * Stage 3 integration tests for WorldListScreen (issue #347).
 *
 * Unlike WorldListScreen.test.tsx, which stubs out WorldList and
 * DeleteConfirmationDialog to isolate the screen's own branching, these
 * tests render the real WorldList -> WorldCard subtree so the screen is
 * exercised the way it actually runs in the app: real routing links and
 * buttons, real cross-store reads from characterStore, and a live
 * useWorldStore.subscribe() wired to a fake store that notifies listeners
 * on change (the shared global worldStore mock has no subscribe()).
 *
 * There is no React ErrorBoundary component anywhere in this codebase, so
 * "error boundaries work correctly" is covered against what the screen
 * actually implements: the try/catch-driven error state and its
 * ErrorDisplay/retry UI.
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type { World } from '@/types/world.types';
import type { Character } from '@/types/character.types';
import type { UserFriendlyError } from '@/lib/utils/errorUtils';
import { ErrorType } from '@/lib/utils/errorUtils';

// ---- Fake worldStore: a real subscribe/notify loop, unlike the shared
// __mocks__/worldStore.ts (no subscribe), so cross-store reactivity is
// actually exercised rather than assumed. ----
type MockWorldState = {
  worlds: Record<string, World>;
  currentWorldId: string | null;
  loading: boolean;
  error: UserFriendlyError | null;
};

let worldState: MockWorldState = {
  worlds: {},
  currentWorldId: null,
  loading: false,
  error: null,
};
let worldListeners: Array<(state: MockWorldState) => void> = [];

const notifyWorldListeners = () => {
  worldListeners.slice().forEach((listener) => listener(worldState));
};

const setWorldState = (updates: Partial<MockWorldState>) => {
  worldState = { ...worldState, ...updates };
  notifyWorldListeners();
};

const mockSetCurrentWorld = jest.fn((id: string | null) => {
  setWorldState({ currentWorldId: id });
});
const mockDeleteWorld = jest.fn((id: string) => {
  const remaining = { ...worldState.worlds };
  delete remaining[id];
  setWorldState({ worlds: remaining });
});
const mockFetchWorlds = jest.fn(() => Promise.resolve());

jest.mock('@/state/worldStore', () => {
  const useWorldStore = Object.assign(
    jest.fn((selector?: (state: MockWorldState) => unknown) =>
      selector ? selector(worldState) : worldState
    ),
    {
      getState: () => ({
        ...worldState,
        setCurrentWorld: mockSetCurrentWorld,
        deleteWorld: mockDeleteWorld,
        fetchWorlds: mockFetchWorlds,
      }),
      subscribe: (listener: (state: MockWorldState) => void) => {
        worldListeners.push(listener);
        return () => {
          worldListeners = worldListeners.filter((l) => l !== listener);
        };
      },
    }
  );
  return { useWorldStore };
});

// ---- Fake characterStore: real enough for WorldCard's cross-store read
// (used to decide where "Play" routes to) and WorldList's character-count
// lookup, without pulling in the full persisted store. ----
let characterState: { characters: Record<string, Character> } = {
  characters: {},
};

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: Object.assign(
    jest.fn((selector?: (state: typeof characterState) => unknown) =>
      selector ? selector(characterState) : characterState
    ),
    { getState: () => characterState }
  ),
}));

// next/navigation's useRouter is a jest.fn() globally (jest.setup.ts);
// give it a real push spy per test.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

import WorldListScreen from '../WorldListScreen';

const baseSettings = {
  maxAttributes: 10,
  maxSkills: 10,
  attributePointPool: 100,
  skillPointPool: 100,
};

function createWorld(overrides: Partial<World> = {}): World {
  return {
    id: 'world-1',
    name: 'Fantasy Realm',
    description: 'A magical world',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: baseSettings,
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
    ...overrides,
  };
}

describe('WorldListScreen integration (#347)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    worldState = { worlds: {}, currentWorldId: null, loading: false, error: null };
    worldListeners = [];
    characterState = { characters: {} };
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  // AC: Integration tests cover navigation to WorldListScreen from main app
  it('displays worlds already in global state when the screen mounts, as when navigating in from elsewhere', () => {
    worldState = {
      ...worldState,
      worlds: { 'world-1': createWorld() },
      currentWorldId: 'world-1',
    };

    render(<WorldListScreen />);

    // Real WorldList -> WorldCard subtree, not a stub — proves the whole
    // tree mounts and renders app state correctly on entry.
    expect(screen.getByTestId('world-card-name')).toHaveTextContent(
      'Fantasy Realm'
    );
  });

  // AC: Tests verify data persistence across navigation
  it('reflects worlds created elsewhere after the screen unmounts and remounts', () => {
    worldState = { ...worldState, worlds: { 'world-1': createWorld() } };

    const { unmount } = render(<WorldListScreen />);
    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();

    // Simulate navigating away, then another part of the app adding a world
    // to the same persistent store.
    unmount();
    worldState = {
      ...worldState,
      worlds: {
        ...worldState.worlds,
        'world-2': createWorld({ id: 'world-2', name: 'Neon City' }),
      },
    };

    // Simulate navigating back to the screen.
    render(<WorldListScreen />);

    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByText('Neon City')).toBeInTheDocument();
  });

  // AC: Tests confirm proper interaction with global state management
  it('re-renders via the store subscription when another feature changes the active world', () => {
    worldState = {
      ...worldState,
      worlds: { 'world-1': createWorld() },
      currentWorldId: null,
    };

    render(<WorldListScreen />);
    expect(screen.queryByText('Currently Active World')).not.toBeInTheDocument();

    // No re-render triggered by the test — this call comes from outside the
    // component, the way another screen or store action would.
    act(() => {
      mockSetCurrentWorld('world-1');
    });

    expect(screen.getByText('Currently Active World')).toBeInTheDocument();
  });

  // AC: Tests validate proper routing behavior when selecting worlds
  it('routes to character creation when Play is clicked for a world with no characters', async () => {
    const user = userEvent.setup();
    worldState = { ...worldState, worlds: { 'world-1': createWorld() } };
    characterState = { characters: {} };

    render(<WorldListScreen />);

    await user.click(screen.getByTestId('world-card-actions-play-button'));

    expect(mockPush).toHaveBeenCalledWith('/characters?worldId=world-1');
  });

  // AC: Tests ensure error boundaries work correctly
  it('shows retryable error UI and re-fetches worlds on retry (no ErrorBoundary exists; this is the screen\'s own error state)', async () => {
    const user = userEvent.setup();
    worldState = {
      ...worldState,
      error: {
        title: 'Failed to Load Worlds',
        message: 'The world list could not be loaded.',
        retryable: true,
        type: ErrorType.UNKNOWN,
        severity: 'error',
      },
    };

    render(<WorldListScreen />);

    expect(screen.getByTestId('world-list-screen-error-message')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(mockFetchWorlds).toHaveBeenCalled();
  });

  // AC: Tests verify accessibility in the integrated context
  it('exposes a main landmark and an accessible name for every world card action, across the real subtree', () => {
    worldState = {
      ...worldState,
      worlds: {
        'world-1': createWorld(),
        'world-2': createWorld({ id: 'world-2', name: 'Neon City' }),
      },
    };

    render(<WorldListScreen />);

    expect(screen.getByRole('main')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName();
    });

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveAccessibleName();
    });
  });
});
