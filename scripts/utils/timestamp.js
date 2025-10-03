/**
 * Generates a UTC timestamp in ISO 8601 format.
 *
 * IMPORTANT: This is a CLI helper that mirrors the TypeScript implementation
 * at src/lib/utils/timestamp.ts. The two implementations must stay in sync.
 * See scripts/utils/__tests__/timestamp.test.js for validation tests.
 *
 * @returns {string} ISO 8601 timestamp string (e.g., "2025-01-15T10:30:00.000Z")
 */
export function getTimestamp() {
  return new Date().toISOString();
}
