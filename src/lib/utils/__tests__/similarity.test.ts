import { calculateJaccardSimilarity } from '../similarity';

describe('calculateJaccardSimilarity', () => {
  test('returns 1.0 for identical strings', () => {
    expect(calculateJaccardSimilarity('Hello world', 'Hello world')).toBe(1.0);
  });

  test('returns 1.0 for case-insensitive match', () => {
    expect(calculateJaccardSimilarity('Hello World', 'hello world')).toBe(1.0);
  });

  test('returns 0.0 for completely different strings', () => {
    expect(calculateJaccardSimilarity('Hello world', 'Goodbye moon')).toBe(0.0);
  });

  test('calculates correct overlap', () => {
    // Tokens: {hello, world} vs {hello, there}
    // Intersection: {hello} (1)
    // Union: {hello, world, there} (3)
    // Score: 1/3 = 0.33...
    expect(calculateJaccardSimilarity('Hello world', 'Hello there')).toBeCloseTo(0.33, 2);
  });

  test('handles duplicates in string correctly (set-based)', () => {
    // Tokens: {hello} vs {hello}
    expect(calculateJaccardSimilarity('Hello hello', 'Hello')).toBe(1.0);
  });

  test('handles empty strings', () => {
    expect(calculateJaccardSimilarity('', '')).toBe(1.0);
    expect(calculateJaccardSimilarity('a', '')).toBe(0.0);
  });

  test('handles punctuation', () => {
    // "Hello, world!" -> {hello, world}
    // "Hello world" -> {hello, world}
    expect(calculateJaccardSimilarity('Hello, world!', 'Hello world')).toBe(1.0);
  });
});
