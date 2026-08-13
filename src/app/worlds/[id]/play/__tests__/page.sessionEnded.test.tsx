/**
 * Tests for the session-ended funnel event's "leaving an active session"
 * trigger: tab close/reload (beforeunload), backgrounding/OS termination on
 * mobile (visibilitychange/pagehide), and navigating away from the play
 * route in-app (unmount) - plus dedup across those paths. The "reached an
 * ending" trigger lives in narrativeStore.markSessionEnded and is covered
 * separately in narrativeStore.tracking.test.ts.
 */

import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { track } from '@vercel/analytics';
import PlayPage from '../page';
import { useParams } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';

const mockTrack = track as jest.Mock;

// jsdom's document.visibilityState is a read-only getter defaulting to
// 'visible' - redefine it per test so visibilitychange can simulate the
// backgrounded/hidden state a mobile OS suspend produces.
const setVisibilityState = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
};

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
    setVisibilityState('visible');
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

  test('visibilitychange (hidden) fires session-ended - covers mobile backgrounding/OS termination', () => {
    useSessionStore.setState({ id: 'session-active' });
    render(<PlayPage />);

    act(() => {
      setVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });

  test('visibilitychange back to visible does not fire session-ended', () => {
    useSessionStore.setState({ id: 'session-active' });
    render(<PlayPage />);

    act(() => {
      setVisibilityState('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockTrack).not.toHaveBeenCalledWith('session-ended');
  });

  test('pagehide fires session-ended', () => {
    useSessionStore.setState({ id: 'session-active' });
    render(<PlayPage />);

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });

  test('dedupes across triggers - hidden then unmount only fires once', () => {
    useSessionStore.setState({ id: 'session-active' });
    const { unmount } = render(<PlayPage />);

    act(() => {
      setVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    unmount();

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });

  test('dedupes across triggers - pagehide then beforeunload only fires once', () => {
    useSessionStore.setState({ id: 'session-active' });
    render(<PlayPage />);

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });
});
