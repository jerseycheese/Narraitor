import {
  writeRecoveryMarker,
  readRecoveryMarker,
  clearRecoveryMarker,
  SessionRecoveryMarker,
} from '../sessionRecoveryMarker';

const marker: SessionRecoveryMarker = {
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'character-1',
  lastActivity: '2026-05-28T12:00:00.000Z',
};

describe('sessionRecoveryMarker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a written marker', () => {
    writeRecoveryMarker(marker);
    expect(readRecoveryMarker()).toEqual(marker);
  });

  it('returns null when no marker has been written (clean state)', () => {
    expect(readRecoveryMarker()).toBeNull();
  });

  it('clears the marker so a clean exit is not seen as a crash', () => {
    writeRecoveryMarker(marker);
    clearRecoveryMarker();
    expect(readRecoveryMarker()).toBeNull();
  });

  it('ignores malformed stored data', () => {
    window.localStorage.setItem('narraitor-session-recovery', '{not json');
    expect(readRecoveryMarker()).toBeNull();

    window.localStorage.setItem('narraitor-session-recovery', JSON.stringify({ sessionId: 'x' }));
    expect(readRecoveryMarker()).toBeNull();
  });
});
