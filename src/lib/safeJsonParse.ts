/**
 * Parses JSON safely, returning the fallback if the input is null/undefined
 * or fails to parse. Logs malformed input via console.error so corruption
 * doesn't disappear silently.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error('safeJsonParse: failed to parse JSON, using fallback', error);
    return fallback;
  }
}
