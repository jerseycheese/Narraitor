import { estimateTokenCount } from '../tokenUtils';

describe('Token Estimation Unit Tests', () => {
  describe('Token Count Estimation', () => {
    it('should correctly estimate tokens for a simple prompt', () => {
      const text = "Hello world.";
      expect(estimateTokenCount(text)).toBe(2);
    });

    it('should correctly estimate tokens for a complex prompt', () => {
      const text = "This is a more complex sentence, with commas and other punctuation!";
      expect(estimateTokenCount(text)).toBe(11);
    });

    it('should handle empty context and return zero tokens', () => {
      expect(estimateTokenCount("")).toBe(0);
      expect(estimateTokenCount(undefined)).toBe(0);
      expect(estimateTokenCount(null)).toBe(0);
    });
  });
});