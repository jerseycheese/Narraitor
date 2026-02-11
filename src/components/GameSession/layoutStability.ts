export const GAME_SESSION_STABLE_COLUMN_HEIGHT = '500px';

/**
 * Keep the narrative panel height stable once multiple segments exist.
 * This prevents surrounding sections from shifting when streamed content grows.
 */
export const getStableNarrativeMaxHeight = (
  segmentCount: number
): string | undefined => {
  return segmentCount > 0 ? GAME_SESSION_STABLE_COLUMN_HEIGHT : undefined;
};

/**
 * Keep choice list growth inside a scrollable panel once gameplay is active.
 */
export const getStableChoicesMaxHeight = (
  segmentCount: number
): string | undefined => {
  return segmentCount > 0 ? GAME_SESSION_STABLE_COLUMN_HEIGHT : undefined;
};
