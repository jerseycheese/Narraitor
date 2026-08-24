const SKILL_CHECK_TAG_PREFIX = 'skill-';
const TRANSIENT_TURN_TAGS = new Set(['item-usage']);

/**
 * Builds the tag list a turn's prompt sees.
 *
 * The previous segment's tags carry forward so scene and mood context survives,
 * but its skill-check tags are dropped first. The scene template reads those as
 * "what the roll did this turn", so letting them ride means the turn after a
 * failure gets narrated as another failure even when its own roll succeeded.
 */
export const mergeTurnTags = (
  previousSegmentTags: string[],
  currentTurnTags: string[]
): string[] => [
  ...previousSegmentTags.filter(
    (tag) => !tag.startsWith(SKILL_CHECK_TAG_PREFIX) && !TRANSIENT_TURN_TAGS.has(tag)
  ),
  ...currentTurnTags,
];
