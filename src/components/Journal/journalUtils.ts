import { JournalEntry } from '@/types/journal.types';

/**
 * A system entry is an automatically-generated session start/end marker, styled
 * differently from player-authored entries.
 */
export const isSystemEntry = (entry: JournalEntry): boolean =>
  Boolean(
    entry.metadata.automaticEntry &&
      (entry.type === 'session_start' || entry.type === 'session_end')
  );

export const getSignificanceBadgeVariant = (
  significance: string
): 'destructive-static' | 'warning-static' | 'secondary-static' => {
  switch (significance) {
    case 'critical':
      return 'destructive-static';
    case 'major':
      return 'warning-static';
    case 'minor':
    default:
      return 'secondary-static';
  }
};
