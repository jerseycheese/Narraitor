/**
 * Session utility functions for consistent session management
 */

/**
 * Formats session duration from milliseconds to human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m" or "45m")
 */
export const formatSessionDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculates the next session number based on existing journal entries with session context
 * @param journalEntries Array of journal entries to check for session numbers
 * @returns Next sequential session number
 */
export const calculateNextSessionNumber = (journalEntries: Array<{ metadata?: { sessionContext?: { sessionNumber?: number } } }>): number => {
  const sessionNumbers = journalEntries
    .map(entry => entry.metadata?.sessionContext?.sessionNumber)
    .filter((n): n is number => typeof n === 'number' && !isNaN(n));
  const max = sessionNumbers.length > 0 ? Math.max(...sessionNumbers) : 0;
  return max + 1;
};