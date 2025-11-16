import {
  normalizeText,
  normalizeWhitespace,
  normalizeQuotationMarks,
  normalizeLineEndings,
  normalizeSpecialCharacters
} from '../textNormalization';

describe('Text Normalization Utilities', () => {
  describe('normalizeText', () => {
    it('standardizes multiple line breaks to double line breaks', () => {
      const input = 'First paragraph.\n\n\n\nSecond paragraph.\n\n\n\nThird paragraph.';
      const result = normalizeText(input);
      expect(result).toBe('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.');
    });

    it('removes excessive spaces within text', () => {
      const input = 'This    has     too    many     spaces.';
      const result = normalizeText(input);
      expect(result).toBe('This has too many spaces.');
    });

    it('normalizes line endings to Unix format', () => {
      const input = 'Windows line\r\nMac line\rUnix line\n';
      const result = normalizeText(input);
      expect(result).toBe('Windows line\nMac line\nUnix line');
    });

    it('normalizes quotation marks', () => {
      const input = '\u201cSmart quotes\u201d and \u2018apostrophes\u2019';
      const result = normalizeText(input);
      expect(result).toBe('"Smart quotes" and \'apostrophes\'');
    });

    it('normalizes special characters', () => {
      const input = 'Em dash—en dash–ellipsis…';
      const result = normalizeText(input);
      expect(result).toBe('Em dash-en dash-ellipsis...');
    });

    it('handles empty input gracefully', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText(null as unknown as string)).toBe('');
      expect(normalizeText(undefined as unknown as string)).toBe('');
    });

    it('preserves semantic structure with complex text', () => {
      const complexText = `Chapter 1: The Beginning\r\n\r\n\r\n"Welcome    to    the    adventure,"    the    guide    said.\r\n\r\nThe    hero    looked    around—amazed    by    the    sight.\r\n\r\n\r\n\r\nThey    would    face    many    challenges    ahead.`;
      const result = normalizeText(complexText);
      
      expect(result).toContain('Chapter 1: The Beginning');
      expect(result).toContain('"Welcome to the adventure," the guide said.');
      expect(result).toContain('The hero looked around-amazed by the sight.');
      expect(result).toContain('They would face many challenges ahead.');
      
      // Should normalize excessive line breaks
      expect(result).not.toContain('\n\n\n');
      // Should normalize excessive spaces
      expect(result).not.toContain('    ');
      // Should normalize special characters
      expect(result).not.toContain('—');
    });

    it('respects normalization options', () => {
      const input = '"Hello    world"\r\nNext    line';
      
      // Test with quotes disabled
      const withoutQuotes = normalizeText(input, { normalizeQuotes: false });
      expect(withoutQuotes).toContain('"Hello world"\nNext line');
      
      // Test with whitespace disabled
      const withoutWhitespace = normalizeText(input, { normalizeWhitespace: false });
      expect(withoutWhitespace).toContain('"Hello    world"');
      
      // Test with line endings disabled - need to also disable whitespace to preserve \r\n
      const withoutLineEndings = normalizeText(input, { 
        normalizeLineEndings: false, 
        normalizeWhitespace: false 
      });
      expect(withoutLineEndings).toContain('\r\n');
    });
  });

  describe('normalizeWhitespace', () => {
    it('removes excessive spaces within paragraphs', () => {
      const input = 'This    has     too    many     spaces.';
      const result = normalizeWhitespace(input);
      expect(result).toBe('This has too many spaces.');
    });

    it('removes trailing and leading whitespace from lines', () => {
      const input = '   Leading spaces\n   More leading spaces   \n   Trailing spaces   ';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Leading spaces\nMore leading spaces\nTrailing spaces');
    });

    it('converts tabs to spaces', () => {
      const input = 'Text\twith\ttabs';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Text with tabs');
    });

    it('preserves paragraph structure by default', () => {
      const input = 'First paragraph.\n\n\nSecond paragraph.';
      const result = normalizeWhitespace(input);
      expect(result).toBe('First paragraph.\n\nSecond paragraph.');
    });

    it('can remove all line breaks when structure is not preserved', () => {
      const input = 'First paragraph.\n\nSecond paragraph.';
      const result = normalizeWhitespace(input, false);
      expect(result).toBe('First paragraph. Second paragraph.');
    });
  });

  describe('normalizeLineEndings', () => {
    it('converts Windows line endings to Unix', () => {
      const input = 'First line\r\nSecond line\r\n';
      const result = normalizeLineEndings(input);
      expect(result).toBe('First line\nSecond line\n');
    });

    it('converts Mac line endings to Unix', () => {
      const input = 'First line\rSecond line\r';
      const result = normalizeLineEndings(input);
      expect(result).toBe('First line\nSecond line\n');
    });

    it('handles mixed line endings', () => {
      const input = 'Windows\r\nMac\rUnix\n';
      const result = normalizeLineEndings(input);
      expect(result).toBe('Windows\nMac\nUnix\n');
    });
  });

  describe('normalizeQuotationMarks', () => {
    it('converts smart quotes to straight quotes', () => {
      const input = '\u201cSmart quotes\u201d and \u2018apostrophes\u2019';
      const result = normalizeQuotationMarks(input);
      expect(result).toBe('"Smart quotes" and \'apostrophes\'');
    });

    it('handles mixed quote styles', () => {
      const input = '\u201cMixed\u201d and \u201dstyles\u201d with \u2018single\u2019 quotes';
      const result = normalizeQuotationMarks(input);
      expect(result).toBe('"Mixed" and "styles" with \'single\' quotes');
    });

    it('preserves existing straight quotes', () => {
      const input = '"Already straight" and \'single\'';
      const result = normalizeQuotationMarks(input);
      expect(result).toBe('"Already straight" and \'single\'');
    });
  });

  describe('normalizeSpecialCharacters', () => {
    it('converts em dashes to hyphens', () => {
      const input = 'Text with em dash—here';
      const result = normalizeSpecialCharacters(input);
      expect(result).toBe('Text with em dash-here');
    });

    it('converts en dashes to hyphens', () => {
      const input = 'Text with en dash–here';
      const result = normalizeSpecialCharacters(input);
      expect(result).toBe('Text with en dash-here');
    });

    it('converts ellipsis to three periods', () => {
      const input = 'Text with ellipsis…here';
      const result = normalizeSpecialCharacters(input);
      expect(result).toBe('Text with ellipsis...here');
    });

    it('handles multiple special characters', () => {
      const input = 'Em dash—en dash–ellipsis…all together';
      const result = normalizeSpecialCharacters(input);
      expect(result).toBe('Em dash-en dash-ellipsis...all together');
    });
  });

  describe('Edge Cases', () => {
    it('handles text with only whitespace', () => {
      const input = '   \t\n\r\n   ';
      const result = normalizeText(input);
      expect(result).toBe('');
    });

    it('handles text with unicode characters', () => {
      const input = 'Unicode: 🚀 emoji    and    special    chars';
      const result = normalizeText(input);
      expect(result).toContain('🚀');
      expect(result).toBe('Unicode: 🚀 emoji and special chars');
    });

    it('handles very long lines', () => {
      const longLine = 'a'.repeat(10000);
      const result = normalizeText(longLine);
      expect(result).toBe(longLine); // Should not change single long line
    });
    
    it('handles nested quotation marks', () => {
      const input = '\u201cShe said, \u2018Hello there,\u2019 to me\u201d';
      const result = normalizeText(input);
      expect(result).toBe('"She said, \'Hello there,\' to me"');
    });
  });
});