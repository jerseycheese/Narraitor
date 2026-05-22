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
