// src/lib/utils/__tests__/textFormatter.test.ts

import { formatAIResponse } from '../textFormatter';
import { FormattingOptions } from '../textFormatter';

describe('formatAIResponse', () => {
  describe('Basic functionality', () => {
    test('should return empty string for empty input', () => {
      expect(formatAIResponse('')).toBe('');
    });

    test('should return null input as empty string', () => {
      expect(formatAIResponse(null)).toBe('');
      expect(formatAIResponse(undefined)).toBe('');
    });

    test('should preserve single line text without changes', () => {
      const input = 'This is a simple sentence.';
      expect(formatAIResponse(input)).toBe(input);
    });
  });

  describe('Paragraph formatting', () => {
    test('should format double line breaks into paragraphs', () => {
      const input = 'First paragraph.\n\nSecond paragraph.';
      const expected = 'First paragraph.\n\nSecond paragraph.';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('should normalize multiple line breaks to double', () => {
      const input = 'First paragraph.\n\n\n\nSecond paragraph.';
      const expected = 'First paragraph.\n\nSecond paragraph.';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('should preserve single line breaks when preserveLineBreaks is true', () => {
      const input = 'Line one\nLine two';
      const options: FormattingOptions = { preserveLineBreaks: true };
      expect(formatAIResponse(input, options)).toBe(input);
    });

    test('should convert single line breaks to spaces by default', () => {
      const input = 'Line one\nLine two';
      const expected = 'Line one Line two';
      expect(formatAIResponse(input)).toBe(expected);
    });
  });

  describe('Dialogue formatting', () => {
    test('should format dialogue with quotation marks', () => {
      const input = 'He said, Hello there!';
      const expected = 'He said, "Hello there!"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should handle multiple dialogue instances', () => {
      const input = 'She said, Hello! and he replied, Hi!';
      const expected = 'She said, "Hello!" and he replied, "Hi!"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should not format dialogue when disabled', () => {
      const input = 'He said, Hello there!';
      expect(formatAIResponse(input)).toBe(input);
    });

    test('should handle dialogue without punctuation', () => {
      const input = 'she said, Hello';
      const expected = 'she said, "Hello"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should handle dialogue at end of line', () => {
      const input = 'At the end: she said, Hello';
      const expected = 'At the end: she said, "Hello"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should handle dialogue with question marks', () => {
      const input = 'She asked, How are you?';
      const expected = 'She asked, "How are you?"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should preserve dialogue that already has quotes', () => {
      const input = 'He said, "Already quoted!"';
      const expected = 'He said, "Already quoted!"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });
  });

  describe('Italics formatting', () => {
    test('should format asterisk-wrapped text as italics', () => {
      const input = 'This is *emphasized* text.';
      const expected = 'This is <em>emphasized</em> text.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should handle multiple italics instances', () => {
      const input = 'Both *this* and *that* are emphasized.';
      const expected = 'Both <em>this</em> and <em>that</em> are emphasized.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should not process italics when disabled', () => {
      const input = 'This is *emphasized* text.';
      expect(formatAIResponse(input)).toBe(input);
    });

    test('should handle edge case of asterisk at sentence boundaries', () => {
      const input = '*Emphasized* at start. At end *emphasized*.';
      const expected = '<em>Emphasized</em> at start. At end <em>emphasized</em>.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should not process unmatched asterisks', () => {
      const input = 'Ending with italics*';
      const expected = 'Ending with italics*';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });
  });

  describe('Whitespace normalization', () => {
    test('should trim leading and trailing whitespace', () => {
      const input = '  Text with spaces  ';
      const expected = 'Text with spaces';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('should normalize multiple spaces to single space', () => {
      const input = 'Text   with    multiple     spaces';
      const expected = 'Text with multiple spaces';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('should handle tabs and normalize to spaces', () => {
      const input = 'Text\twith\ttabs';
      const expected = 'Text with tabs';
      expect(formatAIResponse(input)).toBe(expected);
    });
  });

  describe('Combined formatting options', () => {
    test('should apply all formatting options together', () => {
      const input = 'She said, This is *important*!\n\nThe next paragraph.';
      const expected = 'She said, "This is <em>important</em>!"\n\nThe next paragraph.';
      const options: FormattingOptions = {
        formatDialogue: true,
        enableItalics: true
      };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('should handle complex mixed content', () => {
      const input = '  First paragraph.\n\n\nHe said, Look at *that*!  \n\nFinal paragraph.  ';
      const expected = 'First paragraph.\n\nHe said, "Look at <em>that</em>!"\n\nFinal paragraph.';
      const options: FormattingOptions = {
        formatDialogue: true,
        enableItalics: true
      };
      expect(formatAIResponse(input, options)).toBe(expected);
    });
  });

  describe('Performance considerations', () => {
    test('should handle large text efficiently', () => {
      const largeText = 'Lorem ipsum. '.repeat(1000);
      const startTime = Date.now();
      formatAIResponse(largeText);
      const endTime = Date.now();
      
      // Should process 12KB of text in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
