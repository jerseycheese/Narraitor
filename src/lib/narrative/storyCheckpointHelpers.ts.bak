/**
 * Shared utilities for story checkpoint operations.
 *
 * This module provides helper functions for aggregating and displaying
 * story checkpoint narratives across different components.
 */

/**
 * Build the full story by concatenating all checkpoint segments in chronological order.
 *
 * This function is used in both "The Story So Far" during gameplay and "Your Story"
 * on the ending screen to display a coherent narrative from checkpoint segments.
 *
 * @param checkpoints - Array of checkpoints with segment and createdAt fields
 * @returns Concatenated story text with segments separated by double newlines
 *
 * @example
 * ```typescript
 * const checkpoints = [
 *   { segment: "You entered the tavern...", createdAt: "2025-11-20T10:00:00Z" },
 *   { segment: "A stranger approached...", createdAt: "2025-11-20T10:15:00Z" }
 * ];
 * const story = buildStoryFromCheckpoints(checkpoints);
 * // Returns: "You entered the tavern...\n\nA stranger approached..."
 * ```
 */
export const buildStoryFromCheckpoints = (
  checkpoints: Array<{ segment: string; createdAt: string }>
): string => {
  if (!checkpoints.length) return '';

  // Sort chronologically (oldest first) to maintain narrative order
  const sorted = [...checkpoints].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Join all segments with double newlines for paragraph separation
  return sorted.map(cp => cp.segment).filter(Boolean).join('\n\n');
};
