/**
 * Stage 3 integration tests for WorldListScreen (issue #347).
 *
 * Unlike WorldListScreen.test.tsx, which stubs out WorldList and
 * DeleteConfirmationDialog to isolate the screen's own branching, these
 * tests render the real WorldList -> WorldCard subtree AND drive the real
 * worldStore/characterStore (not hand-rolled doubles). jest.setup.ts
 * automocks @/state/worldStore globally, and that shared mock has no
 * subscribe() (WorldListScreen calls useWorldStore.subscribe() directly,
 * not the selector-hook pattern), so an earlier version of this file wrote
 * its own store double. That double reassigned a module-local variable
 * between renders, which meant the persistence test proved nothing about
 * real store behavior — it would have passed even if store writes never
 * survived a remount. jest.unmock() below switches this file to the real
 * store instead, so a broken create/read/subscribe cycle would actually
 * fail these tests. IndexedDB isn't available in jsdom, so the persist
 * middleware falls back to memory-only storage (see the ResilientStorage
 * warning in test output) — fine here, since what these tests need is the
 * store's in-memory single-source-of-truth behavior across mount cycles,
 * not a real IndexedDB round trip.
 *
 * There is no React ErrorBoundary component anywhere in this codebase, so
 * "error boundaries work correctly" is covered against what the screen
 * actually implements: the try/catch-driven error state and its
 * ErrorDisplay/retry UI.
 *
 * Known gap: "navigation to WorldListScreen from main app" is covered by
 * mounting WorldListScreen directly with state already in the store, not
 * by rendering the real /worlds route and clicking into it. WorldsPage
 * (src/app/worlds/page.tsx) pulls in world generation, tutorial context,
 * and session-store dependencies unrelated to this screen; mocking all of
 * that to reach the same assertion isn't worth it under this component's
 * ownership. What's covered instead, and what's actually this component's
 * job: that it independently bootstraps from already-existing global state
 * on a fresh mount, rather than requiring some hand-off payload from
 * whichever screen sent the user here.
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import type { World } from '@/types/world.types';

// Bypass the global automock from jest.setup.ts for this file only — see
// the file header for why.
jest.unmock('@/state/worldStore');

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

function worldData(
  overrides: Partial<Omit<World, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Omit<World, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Fantasy Realm',
    description: 'A magical world',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: baseSettings,
    ...overrides,
  };
}

describe('WorldListScreen integration (#347)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useWorldStore.getState().reset();
    useCharacterStore.getState().reset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  // AC: Integration tests cover navigation to WorldListScreen from main app
  // (see the "Known gap" note in the file header for what this does and
  // does not prove)
  it('bootstraps from worlds already in the real store on a fresh mount', () => {
    useWorldStore.getState().createWorld(worldData());

    render(<WorldListScreen />);

    expect(screen.getByTestId('world-card-name')).toHaveTextContent(
      'Fantasy Realm'
    );
  });

  // AC: Tests verify data persistence across navigation
  it('shows a world created elsewhere in the app after the screen unmounts and remounts', () => {
    useWorldStore.getState().createWorld(worldData());

    const { unmount } = render(<WorldListScreen />);
    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();

    // Simulate navigating away, then another part of the app creating a
    // world against the same real store.
    unmount();
    useWorldStore.getState().createWorld(worldData({ name: 'Neon City' }));

    // Simulate navigating back to the screen.
    render(<WorldListScreen />);

    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByText('Neon City')).toBeInTheDocument();
  });

  // AC: Tests confirm proper interaction with global state management
  it('re-renders via the real store subscription when another feature changes the active world', () => {
    const worldId = useWorldStore.getState().createWorld(worldData());

    render(<WorldListScreen />);
    expect(screen.queryByText('Currently Active World')).not.toBeInTheDocument();

    // No re-render triggered by the test itself — this call comes from
    // outside the component, the way another screen or store action would.
    act(() => {
      useWorldStore.getState().setCurrentWorld(worldId);
    });

    expect(screen.getByText('Currently Active World')).toBeInTheDocument();
  });

  // AC: Tests validate proper routing behavior when selecting worlds
  it('routes to character creation when Play is clicked for a world with no characters', async () => {
    const user = userEvent.setup();
    const worldId = useWorldStore.getState().createWorld(worldData());

    render(<WorldListScreen />);

    await user.click(screen.getByTestId('world-card-actions-play-button'));

    expect(mockPush).toHaveBeenCalledWith(`/characters?worldId=${worldId}`);
  });

  // AC: Tests ensure error boundaries work correctly (no ErrorBoundary
  // exists in this codebase; this is the screen's own error state)
  it('clears a retryable error and shows the world list after Try Again is clicked', async () => {
    const user = userEvent.setup();
    useWorldStore.getState().createWorld(worldData());
    useWorldStore.getState().setError({
      title: 'Failed to Load Worlds',
      message: 'The world list could not be loaded.',
      retryable: true,
      type: ErrorType.SERVICE,
      severity: 'error',
    });

    render(<WorldListScreen />);
    expect(screen.getByTestId('world-list-screen-error-message')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    // Retry calls the real fetchWorlds(), which clears the store's error —
    // if that wiring broke, the error UI would still be showing here.
    await waitFor(() => {
      expect(
        screen.queryByTestId('world-list-screen-error-message')
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
  });

  // AC: Tests verify accessibility in the integrated context
  it('exposes a main landmark and an accessible name for every world card action, across the real subtree', () => {
    useWorldStore.getState().createWorld(worldData());
    useWorldStore.getState().createWorld(worldData({ name: 'Neon City' }));

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
