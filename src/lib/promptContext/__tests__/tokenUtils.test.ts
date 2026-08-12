import { estimateTokenCount } from '../tokenUtils';

describe('estimateTokenCount', () => {
  it('returns 0 for falsy input', () => {
    expect(estimateTokenCount('')).toBe(0);
    expect(estimateTokenCount('   ')).toBe(0);
    expect(estimateTokenCount(null)).toBe(0);
    expect(estimateTokenCount(undefined)).toBe(0);
  });

  it('returns a positive count for normal prose', () => {
    // "Hello world" → 2 content tokens (no BOS special token)
    expect(estimateTokenCount('Hello world')).toBe(2);
  });

  it('counts punctuated text as more tokens than plain text', () => {
    expect(estimateTokenCount('Hello world')).toBeLessThan(
      estimateTokenCount('Hello, world! How are you?')
    );
  });

  it('handles a single word', () => {
    expect(estimateTokenCount('narraitor')).toBeGreaterThan(0);
  });

  it('handles a single character', () => {
    // 'a' is a single ASCII character → 1 content token
    expect(estimateTokenCount('a')).toBe(1);
  });

  it('returns a reasonable count for a typical sentence', () => {
    // ~10–14 tokens is a reasonable Gemini estimate for this sentence
    const count = estimateTokenCount('The quick brown fox jumps over the lazy dog.');
    expect(count).toBeGreaterThanOrEqual(8);
    expect(count).toBeLessThanOrEqual(16);
  });

  it('scales with text length', () => {
    const short = estimateTokenCount('Hello');
    const medium = estimateTokenCount('Hello world, this is a narrative game.');
    const long = estimateTokenCount(
      'You stand at the edge of an ancient forest. The trees loom overhead, their branches intertwined like grasping fingers. A cold wind stirs the undergrowth.'
    );
    expect(short).toBeLessThan(medium);
    expect(medium).toBeLessThan(long);
  });

  it('handles unicode — emoji', () => {
    const count = estimateTokenCount('Hello 🌍');
    expect(count).toBeGreaterThan(0);
  });

  it('handles unicode — CJK characters', () => {
    const count = estimateTokenCount('你好世界');
    expect(count).toBeGreaterThan(0);
  });

  it('handles code-like text', () => {
    const count = estimateTokenCount('const x = Math.ceil(text.length / 4);');
    expect(count).toBeGreaterThan(5);
  });

  it('handles very long text without throwing', () => {
    const longText = 'word '.repeat(2000);
    const count = estimateTokenCount(longText);
    expect(count).toBeGreaterThan(1000);
  });

  it('trims surrounding whitespace before counting', () => {
    expect(estimateTokenCount('  hello  ')).toBe(estimateTokenCount('hello'));
  });
});
