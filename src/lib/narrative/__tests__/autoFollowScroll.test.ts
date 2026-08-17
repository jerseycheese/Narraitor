import {
  applyScrollEvent,
  createFollowState,
  markAtLatestBeat,
  markLeftLatestBeat,
  markMovedTowardLatestBeat,
  shouldFollowLatestBeat,
} from '../autoFollowScroll';

// A viewport parked at the bottom of a 1000px document.
const PARKED_AT_BOTTOM = { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 };

describe('autoFollowScroll', () => {
  it('keeps following when content grows below the reader without moving them', () => {
    let state = applyScrollEvent(createFollowState(), PARKED_AT_BOTTOM);

    // The turn's decision block renders under the prose: the document gets
    // taller while the reader stays exactly where they were.
    state = applyScrollEvent(state, { ...PARKED_AT_BOTTOM, scrollHeight: 1400 });

    expect(state.hasLeftLatestBeat).toBe(false);
    expect(shouldFollowLatestBeat(state)).toBe(true);
  });

  it('stops following once the reader scrolls back up to re-read', () => {
    let state = applyScrollEvent(createFollowState(), PARKED_AT_BOTTOM);

    state = applyScrollEvent(state, { ...PARKED_AT_BOTTOM, scrollTop: 100 });

    expect(state.hasLeftLatestBeat).toBe(true);
    expect(shouldFollowLatestBeat(state)).toBe(false);
  });

  it('resumes following when the reader returns to the bottom on their own', () => {
    let state = applyScrollEvent(createFollowState(), PARKED_AT_BOTTOM);
    state = applyScrollEvent(state, { ...PARKED_AT_BOTTOM, scrollTop: 100 });
    expect(shouldFollowLatestBeat(state)).toBe(false);

    state = applyScrollEvent(state, PARKED_AT_BOTTOM);

    expect(state.hasLeftLatestBeat).toBe(false);
    expect(shouldFollowLatestBeat(state)).toBe(true);
  });

  it('does not disengage while a following scroll catches up to a grown document', () => {
    // The anchoring scroll runs after the document grew, so the scroll events
    // it emits are measured against the taller scrollHeight on the way down.
    let state = applyScrollEvent(createFollowState(), PARKED_AT_BOTTOM);

    state = applyScrollEvent(state, { scrollTop: 600, scrollHeight: 1400, clientHeight: 500 });
    state = applyScrollEvent(state, { scrollTop: 900, scrollHeight: 1400, clientHeight: 500 });

    expect(state.hasLeftLatestBeat).toBe(false);
    expect(shouldFollowLatestBeat(state)).toBe(true);
  });

  it('follows by default before any scroll has happened', () => {
    expect(shouldFollowLatestBeat(createFollowState())).toBe(true);
  });

  it('treats keyboard navigation away as leaving, and the pill as coming back', () => {
    const scrolledUp = applyScrollEvent(
      applyScrollEvent(createFollowState(), PARKED_AT_BOTTOM),
      { ...PARKED_AT_BOTTOM, scrollTop: 100 }
    );

    const left = markLeftLatestBeat(scrolledUp);
    expect(shouldFollowLatestBeat(left)).toBe(false);

    expect(shouldFollowLatestBeat(markAtLatestBeat(left))).toBe(true);
  });

  // A key pressed at the newest beat scrolls nowhere, so the browser fires no
  // scroll event, and anything asserted about position here is never corrected.
  describe('keys that move nothing at the newest beat', () => {
    const disengaged = { hasLeftLatestBeat: true, isNearBottom: false, lastScrollTop: 500 };

    it('re-engages following on End, which means "take me to the latest"', () => {
      expect(shouldFollowLatestBeat(markAtLatestBeat(disengaged))).toBe(true);
    });

    it('keeps following on downward keys, measuring instead of assuming', () => {
      const state = markMovedTowardLatestBeat(disengaged, PARKED_AT_BOTTOM);

      expect(shouldFollowLatestBeat(state)).toBe(true);
    });
  });

  it('stops following when a downward key lands short of the newest beat', () => {
    const state = markMovedTowardLatestBeat(createFollowState(), {
      ...PARKED_AT_BOTTOM,
      scrollTop: 100,
    });

    expect(shouldFollowLatestBeat(state)).toBe(false);
  });
});
