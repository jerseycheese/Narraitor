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

  describe('Paragraph formatting for readable storytelling', () => {
    test('formats narrative text with standard paragraph breaks', () => {
      const input = 'First paragraph tells the story opening.\n\nSecond paragraph continues the adventure.';
      const expected = 'First paragraph tells the story opening.\n\nSecond paragraph continues the adventure.';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('normalizes inconsistent paragraph spacing for readability', () => {
      const input = 'Opening scene description.\n\n\n\nNext scene with too much spacing.';
      const expected = 'Opening scene description.\n\nNext scene with too much spacing.';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('converts single line breaks to spaces for natural flow', () => {
      const input = 'The hero walks\nthrough the forest';
      const expected = 'The hero walks through the forest';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('preserves intentional line breaks when requested', () => {
      const input = 'Step by step:\nFirst action\nSecond action';
      const options: FormattingOptions = { preserveLineBreaks: true };
      expect(formatAIResponse(input, options)).toBe(input);
    });

    test('handles complex mixed paragraph formatting', () => {
      const input = '  Opening scene.\n\n\nMiddle scene has\nextra spacing.  \n\nFinal scene.  ';
      const expected = 'Opening scene.\n\nMiddle scene has extra spacing.\n\nFinal scene.';
      expect(formatAIResponse(input)).toBe(expected);
    });
  });

  describe('Dialogue formatting with quotation marks and attribution', () => {
    test('formats dialogue with appropriate quotation marks', () => {
      const input = 'The wizard said, I can help you with that quest.';
      const expected = 'The wizard said, "I can help you with that quest."';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('handles multiple dialogue instances with proper attribution', () => {
      const input = 'She said, Hello there!';
      const expected = 'She said, "Hello there!"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('formats dialogue with various speech verbs', () => {
      const input = 'She whispered, The treasure is hidden here.';
      const expected = 'She whispered, "The treasure is hidden here."';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('handles dialogue with questions and exclamations', () => {
      const input = 'The guard asked, Who goes there?';
      const expected = 'The guard asked, "Who goes there?"';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('preserves already quoted dialogue to avoid double formatting', () => {
      const input = 'He said, "I already have quotes around this dialogue."';
      const expected = 'He said, "I already have quotes around this dialogue."';
      const options: FormattingOptions = { formatDialogue: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('leaves dialogue unchanged when formatting is disabled', () => {
      const input = 'She said, This dialogue will not be formatted.';
      expect(formatAIResponse(input)).toBe(input);
    });
  });

  describe('Emphasis formatting for important elements', () => {
    test('formats asterisk-wrapped text with proper emphasis', () => {
      const input = 'The *ancient tome* glowed with mysterious power.';
      const expected = 'The <em>ancient tome</em> glowed with mysterious power.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('handles multiple emphasized elements in narrative', () => {
      const input = 'Both the *sword* and the *shield* were enchanted artifacts.';
      const expected = 'Both the <em>sword</em> and the <em>shield</em> were enchanted artifacts.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('emphasizes important elements at sentence boundaries', () => {
      const input = '*Danger* lurked in every shadow. The hero felt *fear* creeping in.';
      const expected = '<em>Danger</em> lurked in every shadow. The hero felt <em>fear</em> creeping in.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('ignores unmatched asterisks to prevent formatting errors', () => {
      const input = 'The spell costs 50 gold* per casting.';
      const expected = 'The spell costs 50 gold* per casting.';
      const options: FormattingOptions = { enableItalics: true };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('leaves emphasis unchanged when formatting is disabled', () => {
      const input = 'This *important* text will not be emphasized.';
      expect(formatAIResponse(input)).toBe(input);
    });
  });

  describe('Text organization for visual readability', () => {
    test('trims whitespace for clean presentation', () => {
      const input = '  The story begins with extra spaces.  ';
      const expected = 'The story begins with extra spaces.';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('normalizes multiple spaces for consistent spacing', () => {
      const input = 'Words   with    irregular     spacing   throughout.';
      const expected = 'Words with irregular spacing throughout.';
      expect(formatAIResponse(input)).toBe(expected);
    });

    test('converts tabs to spaces for consistent formatting', () => {
      const input = 'Story\twith\ttab\tcharacters.';
      const expected = 'Story with tab characters.';
      expect(formatAIResponse(input)).toBe(expected);
    });
  });

  describe('Consistent formatting across narrative segments', () => {
    test('applies all formatting options consistently', () => {
      const input = 'The sage said, This *ancient* secret is important!';
      const expected = 'The sage said, "This <em>ancient</em> secret is important!"';
      const options: FormattingOptions = {
        formatDialogue: true,
        enableItalics: true
      };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('maintains formatting consistency in complex narrative segments', () => {
      const input = '  She whispered, Look at the *mysterious* artifact!  ';
      const expected = 'She whispered, "Look at the <em>mysterious</em> artifact!"';
      const options: FormattingOptions = {
        formatDialogue: true,
        enableItalics: true
      };
      expect(formatAIResponse(input, options)).toBe(expected);
    });

    test('handles narrative with mixed content types uniformly', () => {
      const input = 'Action description with *emphasis*. He said, For honor!';
      const expected = 'Action description with <em>emphasis</em>. He said, "For honor!"';
      const options: FormattingOptions = {
        formatDialogue: true,
        enableItalics: true
      };
      expect(formatAIResponse(input, options)).toBe(expected);
    });
  });

  describe('Performance and reliability', () => {
    test('handles large narrative content efficiently', () => {
      const largeNarrative = 'Chapter content. '.repeat(1000);
      const startTime = Date.now();
      formatAIResponse(largeNarrative);
      const endTime = Date.now();
      
      // Should process large content in reasonable time for smooth user experience
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('handles edge cases gracefully without errors', () => {
      const edgeCases = [
        '', // empty string
        '   ', // whitespace only
        '*', // single asterisk
        'said, ', // incomplete dialogue
        '\n\n\n', // line breaks only
      ];

      edgeCases.forEach(input => {
        expect(() => formatAIResponse(input, { formatDialogue: true, enableItalics: true }))
          .not.toThrow();
      });
    });
  });
});
