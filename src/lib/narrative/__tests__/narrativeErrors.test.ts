/**
 * Tests for narrative-styled error copy (Issue #201)
 */

import { getNarrativeError } from '../narrativeErrors';

// Jargon that must never reach the player in narrative copy.
const JARGON = [/\bAI\b/, /network/i, /\b429\b/, /timeout/i, /\bAPI\b/, /unauthorized/i, /HTTP/i];

function assertNoJargon(text: string) {
  for (const pattern of JARGON) {
    expect(text).not.toMatch(pattern);
  }
}

describe('getNarrativeError', () => {
  it('frames network errors as a story pause and offers a narrative recovery', () => {
    const result = getNarrativeError(new Error('network connection failed'));
    expect(result.title).toBe('The story paused');
    expect(result.retryLabel).toBe('Continue the story');
    expect(result.retryable).toBe(true);
    assertNoJargon(result.title);
    assertNoJargon(result.message);
    assertNoJargon(result.suggestion ?? '');
  });

  it('lets the player continue after a stream abort', () => {
    const abort = new Error('BodyStreamBuffer was aborted');
    abort.name = 'AbortError';

    const result = getNarrativeError(abort);
    expect(result.title).toBe('The story paused');
    expect(result.retryable).toBe(true);
  });

  it('frames rate-limit/service errors as the story needing a moment', () => {
    const result = getNarrativeError(new Error('429 too many requests'));
    expect(result.title).toBe('The story needs a moment');
    expect(result.retryable).toBe(true);
    assertNoJargon(result.message);
    assertNoJargon(result.suggestion ?? '');
  });

  it('treats auth errors as non-retryable, critical, and points to settings without jargon', () => {
    const result = getNarrativeError(new Error('401 unauthorized'));
    expect(result.retryable).toBe(false);
    expect(result.severity).toBe('critical');
    expect(result.suggestion).toMatch(/Settings/);
    assertNoJargon(result.message);
    assertNoJargon(result.suggestion ?? '');
  });

  it('frames validation errors as something that did not fit the story', () => {
    const result = getNarrativeError(new Error('invalid input data'));
    expect(result.title).toBe('That didn\'t fit the story');
    expect(result.retryable).toBe(false);
    assertNoJargon(result.message);
  });

  it('gives unknown errors a gentle narrative fallback', () => {
    const result = getNarrativeError(new Error('something exploded internally'));
    expect(result.title).toBe('The story stumbled');
    expect(result.retryLabel).toBe('Continue the story');
    assertNoJargon(result.message);
    assertNoJargon(result.suggestion ?? '');
  });

  it('accepts a raw string and still returns clean narrative copy', () => {
    const result = getNarrativeError('network unreachable');
    expect(result.title).toBe('The story paused');
    assertNoJargon(result.message);
  });
});
