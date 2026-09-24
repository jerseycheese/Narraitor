/**
 * Get current timestamp in ISO 8601 format (UTC).
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}
