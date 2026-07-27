/**
 * Strips markdown code fences (```json / ```) from an LLM response and trims.
 * Shared by the AI response parsers so fence handling stays consistent.
 */
export function stripMarkdownFences(raw: string): string {
  let content = raw;
  if (content.includes('```json')) {
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  } else if (content.includes('```')) {
    content = content.replace(/```\s*/g, '');
  }
  return content.trim();
}

/**
 * Returns the substring from the first `{` to the last `}`, or null when no
 * balanced pair is present. Used to recover a JSON object embedded in prose.
 */
export function extractJsonObject(raw: string): string | null {
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }
  return raw.substring(first, last + 1);
}

/**
 * Returns the contents of the first ```json or plain ``` fenced block, or null
 * when none is present. Used by parsers whose contract is "fenced JSON or fall
 * back".
 */
export function extractFencedJson(raw: string): string | null {
  const match = raw.match(/```(?:json)?(?=\s)[ \t]*\r?\n?([\s\S]*?)\s*```/);
  return match ? match[1] : null;
}

/**
 * Strips fences, extracts the embedded JSON object, and parses it. Throws when
 * no object can be located. Use for the common "give me the object the LLM
 * returned" case where the caller handles parse failures via try/catch.
 */
export function parseJsonFromLLM<T = unknown>(raw: string): T {
  const json = extractJsonObject(stripMarkdownFences(raw));
  if (json === null) {
    throw new Error('No JSON object found in LLM response');
  }
  return JSON.parse(json) as T;
}
