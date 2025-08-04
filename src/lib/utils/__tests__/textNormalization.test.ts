import { 
  normalizeText, 
  normalizeParagraphBreaks, 
  normalizeWhitespace, 
  normalizeQuotationMarks, 
  normalizeLineEndings, 
  TextNormalizationOptions 
} from '../textNormalization';

describe('Text Normalization Utilities', () => {
  describe('normalizeParagraphBreaks', () => {
    it('standardizes multiple line breaks to double line breaks', () => {
      const input = 'First paragraph.\n\n\n\nSecond paragraph.\n\n\n\nThird paragraph.';
      const result = normalizeParagraphBreaks(input);
      expect(result).toBe('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.');
    });

    it('converts single line breaks between sentences to paragraph breaks', () => {
      const input = 'First sentence.\nSecond sentence that should be a new paragraph.\nThird sentence.';
      const result = normalizeParagraphBreaks(input);
      expect(result).toBe('First sentence.\n\nSecond sentence that should be a new paragraph.\n\nThird sentence.');
    });

    it('preserves intentional paragraph structure', () => {
      const input = 'Short line.\n\nThis is a proper paragraph with multiple sentences. It should stay together.\n\nAnother paragraph.';
      const result = normalizeParagraphBreaks(input);
      expect(result).toBe('Short line.\n\nThis is a proper paragraph with multiple sentences. It should stay together.\n\nAnother paragraph.');
    });

    it('handles empty input gracefully', () => {
      expect(normalizeParagraphBreaks('')).toBe('');
      expect(normalizeParagraphBreaks(null as any)).toBe('');
      expect(normalizeParagraphBreaks(undefined as any)).toBe('');
    });

    it('handles text with only line breaks', () => {
      const input = '\n\n\n\n';
      const result = normalizeParagraphBreaks(input);
      expect(result).toBe('');
    });
  });

  describe('normalizeWhitespace', () => {
    it('removes excessive spaces within paragraphs', () => {
      const input = 'This    has     too    many     spaces.';
      const result = normalizeWhitespace(input);
      expect(result).toBe('This has too many spaces.');
    });

    it('removes trailing and leading whitespace from lines', () => {
      const input = '   Leading spaces.\n   More spaces.   \n   Final line.   ';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Leading spaces.\nMore spaces.\nFinal line.');
    });

    it('preserves single spaces between words', () => {
      const input = 'Normal text with proper spacing.';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Normal text with proper spacing.');
    });

    it('handles tabs and mixed whitespace characters', () => {
      const input = 'Text\t\twith\ttabs\t\tand   spaces.';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Text with tabs and spaces.');
    });
  });

  describe('normalizeQuotationMarks', () => {
    it('converts curly quotes to straight quotes', () => {
      const input = `"Hello," she said. 'This is quoted.'`;
      const result = normalizeQuotationMarks(input);
      expect(result).toBe(`"Hello," she said. "This is quoted."`);
    });

    it('handles mixed quotation mark styles', () => {
      const input = `He said, "She replied, 'I don't know.'" The conversation continued.`;
      const result = normalizeQuotationMarks(input);
      expect(result).toBe(`He said, "She replied, "I don't know."" The conversation continued.`);
    });

    it('preserves apostrophes in contractions', () => {
      const input = `Don't worry, it's working properly.`;
      const result = normalizeQuotationMarks(input);
      expect(result).toBe(`Don't worry, it's working properly.`);
    });

    it('handles em dashes and special characters', () => {
      const input = 'The journey—filled with adventure—continued.';
      const result = normalizeQuotationMarks(input);
      expect(result).toBe('The journey--filled with adventure--continued.');
    });
  });

  describe('normalizeLineEndings', () => {
    it('converts Windows line endings to Unix format', () => {
      const input = 'Line one.\r\nLine two.\r\nLine three.';
      const result = normalizeLineEndings(input);
      expect(result).toBe('Line one.\nLine two.\nLine three.');
    });

    it('converts Mac line endings to Unix format', () => {
      const input = 'Line one.\rLine two.\rLine three.';
      const result = normalizeLineEndings(input);
      expect(result).toBe('Line one.\nLine two.\nLine three.');
    });

    it('preserves Unix line endings', () => {
      const input = 'Line one.\nLine two.\nLine three.';
      const result = normalizeLineEndings(input);
      expect(result).toBe('Line one.\nLine two.\nLine three.');
    });

    it('handles mixed line ending formats', () => {
      const input = 'Line one.\r\nLine two.\rLine three.\nLine four.';
      const result = normalizeLineEndings(input);
      expect(result).toBe('Line one.\nLine two.\nLine three.\nLine four.');
    });
  });

  describe('normalizeText (main function)', () => {
    const sampleText = `This   is    sample   text.\r\n\r\n\r\n\r\n"Hello," she said. 'How are you?'\r\n\r\nThe journey—filled with adventure—continues.\r\n\r\n\r\nFinal paragraph.`;

    it('applies all normalizations by default', () => {
      const result = normalizeText(sampleText);
      expect(result).toBe(`This is sample text.\n\n"Hello," she said. "How are you?"\n\nThe journey--filled with adventure--continues.\n\nFinal paragraph.`);
    });

    it('applies only paragraph break normalization when specified', () => {
      const options: TextNormalizationOptions = {
        normalizeParagraphs: true,
        normalizeWhitespace: false,
        normalizeQuotes: false,
        normalizeLineEndings: false
      };
      const result = normalizeText(sampleText, options);
      // Should only normalize excessive paragraph breaks, keep other formatting
      expect(result.includes('\r\n')).toBe(true); // Line endings preserved
      expect(result.includes('"')).toBe(true); // Curly quotes preserved
      expect(result.includes('   ')).toBe(true); // Extra spaces preserved
    });

    it('applies only whitespace normalization when specified', () => {
      const options: TextNormalizationOptions = {
        normalizeParagraphs: false,
        normalizeWhitespace: true,
        normalizeQuotes: false,
        normalizeLineEndings: false
      };
      const result = normalizeText(sampleText, options);
      expect(result.includes('   ')).toBe(false); // Extra spaces removed
      expect(result.includes('\r\n\r\n\r\n\r\n')).toBe(true); // Excessive breaks preserved
    });

    it('handles custom normalization combinations', () => {
      const options: TextNormalizationOptions = {
        normalizeParagraphs: true,
        normalizeWhitespace: true,
        normalizeQuotes: false,
        normalizeLineEndings: true
      };
      const result = normalizeText(sampleText, options);
      expect(result.includes('\r\n')).toBe(false); // Line endings normalized
      expect(result.includes('   ')).toBe(false); // Whitespace normalized
      expect(result.includes('"')).toBe(true); // Curly quotes preserved
    });

    it('handles empty input gracefully', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText(null as any)).toBe('');
      expect(normalizeText(undefined as any)).toBe('');
    });

    it('maintains semantic structure with complex text', () => {
      const complexText = `Chapter 1: The Beginning\r\n\r\n\r\n"Welcome    to    the    adventure,"    the    guide    said.\r\n\r\nThe    hero    looked    around—amazed    by    the    sight.\r\n\r\n\r\n\r\nThey    would    face    many    challenges    ahead.`;
      
      const result = normalizeText(complexText);
      
      // Should maintain chapter structure
      expect(result).toContain('Chapter 1: The Beginning');
      // Should normalize spacing
      expect(result).not.toContain('    ');
      // Should maintain paragraph breaks
      expect(result.split('\n\n')).toHaveLength(4);
      // Should normalize quotes
      expect(result).toContain('"Welcome to the adventure," the guide said.');
    });
  });

  describe('Performance with large text', () => {
    it('processes large text efficiently', () => {
      const largeText = 'Sample paragraph with various formatting issues.\r\n\r\n\r\n'.repeat(1000);
      
      const startTime = performance.now();
      const result = normalizeText(largeText);
      const endTime = performance.now();
      
      // Should complete within reasonable time (less than 100ms for 1000 repetitions)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.length).toBeGreaterThan(0);
      expect(result.includes('\r\n')).toBe(false);
    });

    it('handles malformed text without errors', () => {
      const malformedText = '\r\n\r\n\r\n\r\n\r\n"Unclosed quote and strange formatting...\r\n\r\n\r\n\r\nMore   text   with   issues.';
      
      expect(() => normalizeText(malformedText)).not.toThrow();
      const result = normalizeText(malformedText);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});