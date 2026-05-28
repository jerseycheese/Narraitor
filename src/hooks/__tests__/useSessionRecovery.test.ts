import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSessionRecovery } from '../useSessionRecovery';
import {
  writeRecoveryMarker,
  readRecoveryMarker,
} from '@/lib/utils/sessionRecoveryMarker';

const mockPush = jest.fn();

// Control the recovered narrative count without spinning up the real store.
jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: {
    getState: () => ({
      getSessionSegments: (sessionId: string) =>
        sessionId === 'session-crashed' ? [{}, {}, {}] : [],
    }),
  },
}));

const crashMarker = {
  sessionId: 'session-crashed',
  worldId: 'world-1',
  characterId: 'character-1',
  lastActivity: '2026-05-28T12:00:00.000Z',
};

describe('useSessionRecovery (issue #221)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockPush.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('surfaces recovery when an abnormal-exit marker survives', () => {
    // Simulate a crash: the previous run left its live-session marker behind.
    writeRecoveryMarker(crashMarker);

    const { result } = renderHook(() => useSessionRecovery());

    expect(result.current.recovery).toEqual({
      sessionId: 'session-crashed',
      worldId: 'world-1',
      characterId: 'character-1',
      lastActivity: '2026-05-28T12:00:00.000Z',
      narrativeCount: 3,
    });
  });

  it('does not surface recovery after a clean exit (no marker)', () => {
    const { result } = renderHook(() => useSessionRecovery());
    expect(result.current.recovery).toBeNull();
  });

  it('restore routes back into the recovered session', () => {
    writeRecoveryMarker(crashMarker);
    const { result } = renderHook(() => useSessionRecovery());

    act(() => {
      result.current.restore();
    });

    expect(mockPush).toHaveBeenCalledWith('/worlds/world-1/play');
    expect(result.current.recovery).toBeNull();
  });

  it('dismiss clears the marker and hides the prompt', () => {
    writeRecoveryMarker(crashMarker);
    const { result } = renderHook(() => useSessionRecovery());

    act(() => {
      result.current.dismiss();
    });

    expect(readRecoveryMarker()).toBeNull();
    expect(result.current.recovery).toBeNull();
  });

  it('clears the marker on a graceful unload so a refresh is not seen as a crash', () => {
    writeRecoveryMarker(crashMarker);
    renderHook(() => useSessionRecovery());

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(readRecoveryMarker()).toBeNull();
  });
});
