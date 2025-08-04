import { 
  normalizeText, 
  normalizeTextWithDetails,
  normalizeWhitespace, 
  normalizeQuotationMarks, 
  normalizeLineEndings,
  normalizeSpecialCharacters,
  analyzeText,
  getWhitespaceStats,
  type TextNormalizationOptions 
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
      const input = '"Smart quotes" and 'apostrophes'';
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
      
      // Test with line endings disabled
      const withoutLineEndings = normalizeText(input, { normalizeLineEndings: false });
      expect(withoutLineEndings).toContain('\r\n');
    });
  });

  describe('normalizeTextWithDetails', () => {
    it('provides detailed normalization information', () => {
      const input = '"Hello    world"\r\nNext—line';
      const result = normalizeTextWithDetails(input);
      
      expect(result.normalized).toBeDefined();
      expect(result.changes).toBeInstanceOf(Array);
      expect(result.stats).toBeDefined();
      expect(result.stats.originalLength).toBe(input.length);
      expect(result.stats.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('tracks changes made during normalization', () => {
      const input = 'Text    with\r\nexcessive    spacing';
      const result = normalizeTextWithDetails(input);
      
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.some(change => change.type === 'whitespace')).toBe(true);
      expect(result.changes.some(change => change.type === 'lineEndings')).toBe(true);
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

    it('can convert to different formats', () => {
      const input = 'Line one\nLine two\n';
      
      const windows = normalizeLineEndings(input, 'windows');
      expect(windows).toBe('Line one\r\nLine two\r\n');
      
      const mac = normalizeLineEndings(input, 'mac');
      expect(mac).toBe('Line one\rLine two\r');
    });
  });

  describe('normalizeQuotationMarks', () => {
    it('converts smart quotes to straight quotes', () => {
      const input = '"Smart quotes" and 'apostrophes'';
      const result = normalizeQuotationMarks(input);
      expect(result).toBe('"Smart quotes" and \'apostrophes\'');
    });

    it('handles mixed quote styles', () => {
      const input = '"Mixed" and "styles" with 'single' quotes';
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

  describe('analyzeText', () => {
    it('provides accurate text statistics', () => {
      const input = 'Line one\nLine two\n\nParagraph two';
      const analysis = analyzeText(input);
      
      expect(analysis.characters).toBe(input.length);
      expect(analysis.lines).toBe(4); // 3 lines plus empty line
      expect(analysis.paragraphs).toBe(2);
      expect(analysis.words).toBe(5);
      expect(analysis.lineEndingFormat).toBe('unix');
    });

    it('detects line ending formats', () => {
      const windows = analyzeText('Line\r\nTwo\r\n');
      expect(windows.lineEndingFormat).toBe('windows');
      
      const mac = analyzeText('Line\rTwo\r');
      expect(mac.lineEndingFormat).toBe('mac');
      
      const mixed = analyzeText('Windows\r\nMac\rUnix\n');
      expect(mixed.lineEndingFormat).toBe('mixed');
    });

    it('detects special characters and smart quotes', () => {
      const withSpecial = analyzeText('"Smart quotes" and em dash—here');
      expect(withSpecial.hasSmartQuotes).toBe(true);
      expect(withSpecial.hasSpecialChars).toBe(true);
      
      const withoutSpecial = analyzeText('"Regular quotes" and hyphen-here');
      expect(withoutSpecial.hasSmartQuotes).toBe(false);
      expect(withoutSpecial.hasSpecialChars).toBe(false);
    });

    it('handles empty input', () => {
      const analysis = analyzeText('');
      expect(analysis.characters).toBe(0);
      expect(analysis.lines).toBe(0);
      expect(analysis.paragraphs).toBe(0);
      expect(analysis.words).toBe(0);
    });
  });

  describe('getWhitespaceStats', () => {
    it('counts leading and trailing whitespace', () => {
      const input = '   Text with spaces   ';
      const stats = getWhitespaceStats(input);
      
      expect(stats.leading).toBe(3);
      expect(stats.trailing).toBe(3);
    });

    it('counts excessive spaces and tabs', () => {
      const input = 'Text    with\ttabs    and    spaces';
      const stats = getWhitespaceStats(input);
      
      expect(stats.excessiveSpaces).toBeGreaterThan(0);
      expect(stats.tabs).toBe(1);
    });

    it('counts multiple line breaks', () => {
      const input = 'First\n\n\nSecond\n\n\n\nThird';
      const stats = getWhitespaceStats(input);
      
      expect(stats.multipleLineBreaks).toBe(2);
    });

    it('handles empty input', () => {
      const stats = getWhitespaceStats('');
      expect(stats.leading).toBe(0);
      expect(stats.trailing).toBe(0);
      expect(stats.excessiveSpaces).toBe(0);
      expect(stats.tabs).toBe(0);
      expect(stats.multipleLineBreaks).toBe(0);
    });
  });

  describe('Performance', () => {
    it('processes large text efficiently', () => {
      const largeText = 'Sample text with    spaces\r\n'.repeat(1000);
      const startTime = performance.now();
      
      const result = normalizeTextWithDetails(largeText);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(result.normalized).toBeDefined();
      expect(processingTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result.stats.processingTime).toBeGreaterThan(0);
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
      const input = '"She said, 'Hello there,' to me"';
      const result = normalizeText(input);
      expect(result).toBe('"She said, \'Hello there,\' to me"');
    });
  });
});