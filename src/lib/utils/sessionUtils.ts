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
 * Gets system event icon for journal display
 * @param type Journal entry type
 * @returns Unicode emoji for the event type
 */
export const getSystemEventIcon = (type: string): string => {
  switch (type) {
    case 'session_start': return '🎮';
    case 'session_end': return '⏹️';
    default: return '⚙️';
  }
};

/**
 * Calculates the next session number based on existing saved sessions
 * @param savedSessions Map of saved sessions
 * @returns Next sequential session number
 */
export const calculateNextSessionNumber = (savedSessions: Record<string, { sessionNumber?: number }>): number => {
  const sessions = Object.values(savedSessions);
  const numbers = sessions
    .map(s => s.sessionNumber)
    .filter(n => typeof n === 'number' && !isNaN(n));
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return max + 1;
};