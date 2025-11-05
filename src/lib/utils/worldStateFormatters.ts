import { PlayerCharacterThread, CharacterRelationshipState } from '@/types/world-state.types';

const DEFAULT_THREAD_SUMMARY_MAX_LENGTH = 220;

/**
 * Produce a concise summary of the most recent activity in a player character thread.
 * Prefers the latest highlight, falling back to the thread summary when needed.
 */
export function summarizeThreadHighlight(
  thread: PlayerCharacterThread | undefined,
  maxLength: number = DEFAULT_THREAD_SUMMARY_MAX_LENGTH
): string | undefined {
  if (!thread) {
    return undefined;
  }

  const source =
    (thread.highlights && thread.highlights.length > 0
      ? thread.highlights[thread.highlights.length - 1]
      : thread.summary) ?? '';

  const trimmed = source.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const ellipsisSafeLength = Math.max(maxLength - 3, 0);
  return `${trimmed.slice(0, ellipsisSafeLength)}...`;
}

/**
 * Translate numeric relationship scores into a brief human-readable description.
 */
export function describeCharacterRelationship(relationship: CharacterRelationshipState): string {
  const sentiment =
    relationship.sentiment > 40
      ? 'warm'
      : relationship.sentiment < -40
        ? 'hostile'
        : relationship.sentiment >= 0
          ? 'cautious'
          : 'strained';

  const trust =
    relationship.trust > 70
      ? 'high trust'
      : relationship.trust < 30
        ? 'low trust'
        : 'guarded trust';

  const tension =
    relationship.tension > 60
      ? 'volatile'
      : relationship.tension > 30
        ? 'tense'
        : 'steady';

  return `${sentiment}, ${trust}, ${tension}`;
}
