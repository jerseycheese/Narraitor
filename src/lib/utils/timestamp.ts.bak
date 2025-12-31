/**
 * Get current timestamp in ISO 8601 format (UTC)
 *
 * Centralized timestamp generation for consistency across the application.
 * Returns timestamps in standard ISO 8601 format with millisecond precision.
 *
 * @returns ISO 8601 timestamp string (e.g., "2025-01-15T10:30:00.000Z")
 *
 * @example Basic usage
 * const now = getTimestamp();
 * // "2025-01-15T10:30:00.000Z"
 *
 * @example Usage in entity creation
 * const entity = {
 *   id: generateUniqueId('entity'),
 *   name: 'Example',
 *   createdAt: getTimestamp(),
 *   updatedAt: getTimestamp()
 * };
 *
 * @example Testing with mocked timestamps
 * import { getTimestamp } from '@/lib/utils';
 *
 * // Use jest.useFakeTimers() to control timestamp output
 * jest.useFakeTimers();
 * jest.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
 * const timestamp = getTimestamp();
 * expect(timestamp).toBe("2025-01-15T10:30:00.000Z");
 *
 * @example Simulating time progression in tests
 * jest.useFakeTimers();
 * jest.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
 * const before = getTimestamp(); // "2025-01-15T10:00:00.000Z"
 *
 * jest.setSystemTime(new Date('2025-01-15T11:00:00.000Z'));
 * const after = getTimestamp(); // "2025-01-15T11:00:00.000Z"
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}
