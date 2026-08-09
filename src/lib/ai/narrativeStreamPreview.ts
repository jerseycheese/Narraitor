// src/lib/ai/narrativeStreamPreview.ts

import { stripMarkdownFences } from './parseJSON';

const FENCE_MARKER = '```json';

/**
 * True while `text` could still turn into the opening fence marker as more
 * characters arrive — not just an exact-length match ("`", "``", "```json")
 * but any in-progress prefix ("```j", "```jso", ...). A prefix-length regex
 * only catching the exact backtick run or the fully-typed word missed those
 * partial-word states, which let fence characters leak into the preview as
 * prose for a chunk or two.
 */
function isPartialFencePrefix(text: string): boolean {
  return FENCE_MARKER.startsWith(text) && text.length < FENCE_MARKER.length;
}

/**
 * Extracts the currently-decodable prefix of the "content" field from a
 * growing, possibly-incomplete JSON buffer streamed from the model.
 *
 * The narrative response format wraps prose in
 * `{"content": "...", "type": ..., "metadata": {...}}` (see
 * narrativeGenerator.prompt.ts and the narrative templates). Mid-stream, the
 * buffer is a truncated JSON document — this recovers whatever of the
 * "content" string value has arrived so far, unescaped, without waiting for
 * the closing brace.
 *
 * Recomputes from scratch on every call rather than tracking incremental
 * state: a chunk boundary that lands mid-escape-sequence just yields the
 * previous safe prefix until the next chunk resolves it, so a caller can
 * call this after every network chunk without ever emitting a mangled
 * character.
 */
export function extractStreamingContentPreview(rawBuffer: string): string {
  // Check the RAW (pre-strip) buffer for a partial fence: stripMarkdownFences
  // already consumes a complete "```" run, so by the time it's run, a
  // partial one ("```j") has had its backticks removed and no longer looks
  // like a fence prefix — checking after stripping missed exactly the
  // in-progress case this guard exists for.
  const trimmedRaw = rawBuffer.trimStart();
  if (isPartialFencePrefix(trimmedRaw)) {
    return '';
  }

  const stripped = stripMarkdownFences(trimmedRaw).trimStart();

  const contentFieldStart = stripped.indexOf('"content"');
  if (contentFieldStart === -1) {
    // No "content" field visible yet. If the model hasn't started emitting
    // JSON structure at all, show the raw buffer as-is so early chunks of a
    // plain-prose response (unexpected, but not our contract to enforce)
    // aren't held back.
    return stripped.startsWith('{') ? '' : stripped;
  }

  const colonIndex = stripped.indexOf(':', contentFieldStart);
  if (colonIndex === -1) return '';

  const valueStart = stripped.indexOf('"', colonIndex + 1);
  if (valueStart === -1) return '';

  let result = '';
  for (let i = valueStart + 1; i < stripped.length; i++) {
    const char = stripped[i];

    if (char === '\\') {
      const next = stripped[i + 1];
      if (next === undefined) break; // escape sequence cut off mid-chunk
      if (next === 'n') result += '\n';
      else if (next === 't') result += '\t';
      else result += next; // \" \\ \/ and anything else: literal char
      i++;
      continue;
    }

    if (char === '"') break; // unescaped quote closes the string

    result += char;
  }

  return result;
}
