// src/state/__tests__/narrativeStore.markSessionEnded.test.ts
//
// Regression test for #1206: markSessionEnded used to call `eval('require(...)')`
// to defer-load sessionStore. That throws `require is not defined` in the
// Next.js client bundle, but the surrounding try/catch swallowed it so the
// failure was silent. We replaced it with a static ESM import.
//
// Asserts:
//   1. markSessionEnded updates endedSessions synchronously
//   2. It propagates lifecycle status to sessionStore in the same tick
//   3. It does not throw

import { useNarrativeStore } from '../narrativeStore';
import { useSessionStore } from '../sessionStore';

const SESSION_ID = 'session-mark-ended-1206';
const WORLD_ID = 'world-1206';
const CHARACTER_ID = 'char-1206';

const seedLifecycle = () => {
  useSessionStore.setState({
    sessionLifecycle: {
      [SESSION_ID]: {
        id: SESSION_ID,
        worldId: WORLD_ID,
        characterId: CHARACTER_ID,
        status: 'active',
        lastActivity: new Date().toISOString(),
      },
    },
  });
};

describe('narrativeStore.markSessionEnded (#1206 regression)', () => {
  beforeEach(() => {
    useNarrativeStore.setState({ endedSessions: {} });
    useSessionStore.setState({ sessionLifecycle: {} });
  });

  it('marks the session ended in narrativeStore synchronously', () => {
    seedLifecycle();

    expect(() => {
      useNarrativeStore.getState().markSessionEnded(SESSION_ID);
    }).not.toThrow();

    expect(useNarrativeStore.getState().isSessionEnded(SESSION_ID)).toBe(true);
  });

  it('propagates lifecycle status to sessionStore', () => {
    seedLifecycle();

    useNarrativeStore.getState().markSessionEnded(SESSION_ID);

    expect(useSessionStore.getState().getSessionLifecycle(SESSION_ID)?.status).toBe('ended');
  });

  it('does not throw if lifecycle entry is missing in sessionStore', () => {
    expect(() => {
      useNarrativeStore.getState().markSessionEnded('unknown-session');
    }).not.toThrow();
    expect(useNarrativeStore.getState().isSessionEnded('unknown-session')).toBe(true);
  });
});
