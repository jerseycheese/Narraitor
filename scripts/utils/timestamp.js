/**
 * Generates a UTC timestamp in ISO 8601 format.
 * Matches the format produced by the shared application utility.
 */
export function getTimestamp() {
  return new Date().toISOString();
}
