/**
 * Tests for the session-ended funnel event's "leaving an active session"
 * trigger: tab close/reload (beforeunload) and navigating away from the play
 * route in-app (unmount). The "reached an ending" trigger lives in
 * narrativeStore.markSessionEnded and is covered separately in
 * narrativeStore.tracking.test.ts.
 */

import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { track } from '@vercel/analytics';
import PlayPage from '../page';
import { useParams } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';

const mockTrack = track as jest.Mock;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: jest.fn().mockReturnValue({ id: 'world-1' }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  notFound: jest.fn(),
}));

jest.mock('@/components/GameSession/GameSession', () => {
  return function DummyGameSession({ worldId }: { worldId: string }) {
    return <div data-testid="mock-game-session">Game Session for {worldId}</div>;
  };
});

describe('Play Page - session-ended funnel tracking', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    (useParams as jest.Mock).mockReturnValue({ id: 'world-1' });
    mockTrack.mockClear();
    useNarrativeStore.setState({ currentEnding: null });
  });

  afterEach(() => {
    cleanup();
    useSessionStore.setState({ id: null });
    useNarrativeStore.setState({ currentEnding: null });
  });

  test('beforeunload fires session-ended for an active, unfinished session', () => {
    useSessionStore.setState({ id: 'session-active' });
    render(<PlayPage />);

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });

  test('unmounting (navigating away) fires session-ended for an active, unfinished session', () => {
    useSessionStore.setState({ id: 'session-active' });
    const { unmount } = render(<PlayPage />);

    unmount();

    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });

  test('does not fire when there is no active session', () => {
    useSessionStore.setState({ id: null });
    const { unmount } = render(<PlayPage />);

    unmount();

    expect(mockTrack).not.toHaveBeenCalledWith('session-ended');
  });

  test('does not double-fire when an ending was already reached', () => {
    useSessionStore.setState({ id: 'session-active' });
    useNarrativeStore.setState({
      currentEnding: { id: 'ending-1' } as ReturnType<typeof useNarrativeStore.getState>['currentEnding'],
    });
    const { unmount } = render(<PlayPage />);

    unmount();

    expect(mockTrack).not.toHaveBeenCalledWith('session-ended');
  });
});
