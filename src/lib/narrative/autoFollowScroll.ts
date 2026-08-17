/**
 * Whether the play surface should keep following new narrative beats.
 *
 * This lives outside the component on purpose. jsdom has no layout engine, so
 * a unit test can't measure a scroller, but the decision itself is arithmetic
 * over measurements and that part can be tested for real. The measuring stays
 * in NarrativeHistory and is checked against the surface's actual scroller in
 * tests/visual/narrative-reading-position.spec.ts.
 */

/**
 * Slack for "parked at the latest beat". A narrative beat renders far taller
 * than this, so it can't absorb one.
 */
const NEAR_BOTTOM_THRESHOLD_PX = 100;

export interface ScrollMeasurement {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface FollowState {
  /** The reader deliberately moved off the latest beat. */
  hasLeftLatestBeat: boolean;
  isNearBottom: boolean;
  lastScrollTop: number;
}

export function createFollowState(): FollowState {
  return { hasLeftLatestBeat: false, isNearBottom: true, lastScrollTop: 0 };
}

function measureIsNearBottom({
  scrollTop,
  scrollHeight,
  clientHeight,
}: ScrollMeasurement): boolean {
  return scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
}

/**
 * Fold one scroll event into the follow state.
 *
 * Distance from the bottom can't decide this alone. The scroller holds the
 * whole turn (prose, decision block, consequence callout), so content landing
 * below the reader grows scrollHeight and pushes the bottom away without them
 * moving a pixel. Treating that as "they scrolled off" strands the surface on
 * an old beat for the rest of the session, because nothing but the
 * jump-to-latest pill ever cleared the flag.
 *
 * A backwards scrollTop is the signal that carries real intent: growth never
 * moves a reader up, and every way to leave (wheel, trackpad, scrollbar drag,
 * keys) does.
 */
export function applyScrollEvent(
  state: FollowState,
  measurement: ScrollMeasurement
): FollowState {
  const nearBottom = measureIsNearBottom(measurement);
  const didScrollUp = measurement.scrollTop < state.lastScrollTop;

  return {
    lastScrollTop: measurement.scrollTop,
    isNearBottom: nearBottom,
    // Getting back to the latest beat clears the flag, so following resumes
    // under the reader's own steam instead of only via the pill.
    hasLeftLatestBeat: nearBottom ? false : state.hasLeftLatestBeat || didScrollUp,
  };
}

/**
 * The reader took the view somewhere themselves (keyboard navigation).
 *
 * Deliberately leaves isNearBottom alone. Keys that travel towards the newest
 * beat (End, PageDown) move nothing when the view is already parked there, so
 * the browser fires no scroll event to correct an assumption made here. Let
 * the position speak for itself and following survives those keys, as it did
 * before this state moved out of the component.
 */
export function markLeftLatestBeat(state: FollowState): FollowState {
  return { ...state, hasLeftLatestBeat: true };
}

/** Snapped back to the newest beat, by the pill or by a following scroll. */
export function markAtLatestBeat(state: FollowState): FollowState {
  return { ...state, hasLeftLatestBeat: false, isNearBottom: true };
}

/** Whether a newly arrived beat should pull the view down to it. */
export function shouldFollowLatestBeat(state: FollowState): boolean {
  return !state.hasLeftLatestBeat || state.isNearBottom;
}
