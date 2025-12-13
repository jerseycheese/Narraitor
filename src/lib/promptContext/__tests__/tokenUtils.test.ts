import { estimateTokenCount, truncateToTokenLimit } from '../tokenUtils';

describe('tokenUtils', () => {
  describe('estimateTokenCount', () => {
    it('returns 0 for empty text', () => {
      expect(estimateTokenCount('')).toBe(0);
      expect(estimateTokenCount('   ')).toBe(0);
      expect(estimateTokenCount(null)).toBe(0);
      expect(estimateTokenCount(undefined)).toBe(0);
    });

    it('counts punctuation as extra tokens', () => {
      expect(estimateTokenCount('Hello world')).toBeLessThan(
        estimateTokenCount('Hello, world!')
      );
    });

    it('treats very long words as more than one token', () => {
      expect(estimateTokenCount('supercalifragilisticexpialidocious')).toBeGreaterThan(1);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('returns empty string when limit <= 0', () => {
      expect(truncateToTokenLimit('Hello world', 0)).toBe('');
      expect(truncateToTokenLimit('Hello world', -1)).toBe('');
    });

    it('does not truncate when already within limit', () => {
      const text = 'Hello world';
      const limit = estimateTokenCount(text);
      expect(truncateToTokenLimit(text, limit)).toBe(text);
    });

    it('truncates long text and preserves word boundaries where possible', () => {
      const text = `START ${new Array(2000).fill('word').join(' ')} END_MARKER`;
      const truncated = truncateToTokenLimit(text, 200);

      expect(truncated).toContain('START');
      expect(truncated).not.toContain('END_MARKER');
      expect(estimateTokenCount(truncated)).toBeLessThanOrEqual(200);
    });
  });
});

