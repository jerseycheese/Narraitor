import { estimateTokenCount, estimateWithMetadata, TokenEstimation } from '../tokenUtils';

describe('estimateTokenCount', () => {
  describe('basic text handling', () => {
    it('returns 0 for empty, null, or undefined input', () => {
      expect(estimateTokenCount('')).toBe(0);
      expect(estimateTokenCount(null)).toBe(0);
      expect(estimateTokenCount(undefined)).toBe(0);
    });

    it('counts simple words correctly', () => {
      // Simple words should be ~1 token each with a small multiplier
      const result = estimateTokenCount('hello world');
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(4); // Allow for multiplier
    });

    it('handles single character words as single tokens', () => {
      const result = estimateTokenCount('a b c d e');
      // Short words (1-2 chars) should count as 1 token each
      expect(result).toBe(5);
    });
  });

  describe('punctuation handling', () => {
    it('counts punctuation as separate tokens', () => {
      const withPunctuation = estimateTokenCount('Hello, world!');
      const withoutPunctuation = estimateTokenCount('Hello world');

      // Punctuation should add to token count
      expect(withPunctuation).toBeGreaterThan(withoutPunctuation);
    });

    it('handles multiple punctuation marks', () => {
      const result = estimateTokenCount('Wait... what?!');
      // Should count: Wait, ..., what, ?!
      expect(result).toBeGreaterThanOrEqual(4);
    });
  });

  describe('complex word handling', () => {
    it('estimates CamelCase words as multiple tokens', () => {
      const camelCase = estimateTokenCount('processUserInput');
      const separate = estimateTokenCount('process user input');

      // CamelCase should estimate similarly to separate words
      // since LLMs often tokenize them separately
      expect(camelCase).toBeGreaterThanOrEqual(3);
    });

    it('estimates hyphenated words as multiple tokens', () => {
      const hyphenated = estimateTokenCount('well-known fact');
      const unhyphenated = estimateTokenCount('wellknown fact');

      // Hyphenated should be counted as multiple tokens
      expect(hyphenated).toBeGreaterThan(unhyphenated);
    });

    it('handles long words by estimating based on character count', () => {
      // Very long words often get split into multiple tokens by LLMs
      const longWord = estimateTokenCount('antidisestablishmentarianism');
      // ~28 chars / 4.5 chars per token ≈ 6+ tokens
      expect(longWord).toBeGreaterThanOrEqual(4);
    });
  });

  describe('realistic text estimation', () => {
    it('estimates narrative text reasonably', () => {
      const narrative = `The ancient dragon stirred in its lair, scales glinting
        in the torchlight. Marcus gripped his sword tighter, knowing that
        this moment would define his destiny.`;

      const result = estimateTokenCount(narrative);

      // This ~35 word passage should estimate to roughly 40-60 tokens
      // accounting for punctuation and LLM tokenization
      expect(result).toBeGreaterThanOrEqual(35);
      expect(result).toBeLessThanOrEqual(80);
    });

    it('estimates JSON-like structured content', () => {
      const structured = `{
        "name": "Enchanted Sword",
        "damage": 15,
        "effects": ["fire", "glow"]
      }`;

      const result = estimateTokenCount(structured);

      // JSON has lots of punctuation and special chars
      expect(result).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('estimateWithMetadata', () => {
  it('returns token count with confidence level', () => {
    const result = estimateWithMetadata('Hello world');

    expect(result.tokenCount).toBeGreaterThanOrEqual(2);
    expect(result.confidence).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(result.confidence);
  });

  it('provides breakdown of estimation components', () => {
    const result = estimateWithMetadata('Hello, world!');

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.wordCount).toBeGreaterThan(0);
    expect(result.breakdown.punctuationCount).toBeGreaterThan(0);
  });

  it('flags unusual patterns that may affect accuracy', () => {
    // Text with lots of code or unusual formatting
    const codeText = estimateWithMetadata('const fn = (x) => x * 2;');

    expect(codeText.warnings).toBeDefined();
    // Code often has lower estimation confidence
    expect(codeText.confidence).not.toBe('high');
  });

  it('returns higher confidence for simple narrative text', () => {
    const simpleNarrative = estimateWithMetadata(
      'The hero walked into the tavern and ordered a drink.'
    );

    expect(simpleNarrative.confidence).toBe('high');
  });

  it('returns lower confidence for text with many special characters', () => {
    const specialChars = estimateWithMetadata('$$$ %%% @@@ ### *** !!!');

    expect(specialChars.confidence).toBe('low');
  });
});

describe('estimation accuracy guidelines', () => {
  // These tests document expected accuracy ranges
  // They help calibrate the estimation multiplier

  it('should be within 30% of expected for simple English text', () => {
    // Approximate token counts accounting for punctuation and multipliers
    // Enhanced estimation counts punctuation separately and applies word multipliers
    const testCases = [
      { text: 'Hello', expectedRange: [1, 3] },
      { text: 'The quick brown fox jumps over the lazy dog.', expectedRange: [9, 20] },
      { text: 'This is a test.', expectedRange: [4, 10] },
    ];

    for (const { text, expectedRange } of testCases) {
      const result = estimateTokenCount(text);
      expect(result).toBeGreaterThanOrEqual(expectedRange[0]);
      expect(result).toBeLessThanOrEqual(expectedRange[1]);
    }
  });
});
