// src/lib/utils/__tests__/textFormatter.storytelling.test.ts

import { formatAIResponse, FormattingOptions } from '../textFormatter';

describe('Text Formatter - Storytelling Features (Issue #231)', () => {
  const storytellingOptions: FormattingOptions = {
    formatDialogue: true,
    enableItalics: true,
    preserveLineBreaks: false,
    outputFormat: 'html'
  };

  describe('Readable storytelling formatting', () => {
    it('should format narrative paragraphs for storytelling readability', () => {
      const input = `The ancient forest was alive with mystery.\n\nEvery tree seemed to whisper secrets.\n\nThe path ahead was uncertain.`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>The ancient forest was alive with mystery.</p>\n<p>Every tree seemed to whisper secrets.</p>\n<p>The path ahead was uncertain.</p>');
      // Verify paragraph structure is maintained for readability
      expect(result.match(/<p>/g)).toHaveLength(3);
    });

    it('should format dialogue with proper quotation marks and attribution', () => {
      const input = `The guide said, Follow me carefully. The traveler replied, I understand the danger.`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>The guide said, "Follow me carefully." The traveler replied, "I understand the danger."</p>');
      // Verify both dialogue instances are properly quoted
      expect(result.match(/"/g)).toHaveLength(4);
    });

    it('should emphasize important story elements through formatting', () => {
      const input = `The *ancient* artifact glowed with *mysterious* power.`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>The <em>ancient</em> artifact glowed with <em>mysterious</em> power.</p>');
      // Verify emphasis tags are properly applied
      expect(result.match(/<em>/g)).toHaveLength(2);
      expect(result.match(/<\/em>/g)).toHaveLength(2);
    });

    it('should organize mixed content for visual storytelling flow', () => {
      const input = `The tavern was *bustling* with activity.\n\nThe bartender said, What can I get you?\n\nThe atmosphere was tense.`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>The tavern was <em>bustling</em> with activity.</p>\n<p>The bartender said, "What can I get you?"</p>\n<p>The atmosphere was tense.</p>');
      // Verify all formatting is applied consistently
      expect(result).toContain('<em>bustling</em>');
      expect(result).toContain('"What can I get you?"');
      expect(result.match(/<p>/g)).toHaveLength(3);
    });
  });

  describe('Dialogue formatting for storytelling', () => {
    it('should handle complex dialogue with various speech verbs', () => {
      const speechVerbs = ['said', 'replied', 'whispered', 'shouted', 'muttered', 'declared', 'exclaimed', 'asked'];
      
      speechVerbs.forEach(verb => {
        const input = `He ${verb}, This is important!`;
        const result = formatAIResponse(input, storytellingOptions);
        
        expect(result).toBe(`<p>He ${verb}, "This is important!"</p>`);
      });
    });

    it('should preserve dialogue that already has proper quotation marks', () => {
      const input = `She said, "I already have quotes!" He replied, "Me too!"`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>She said, "I already have quotes!" He replied, "Me too!"</p>');
      // Should not add extra quotes to already quoted dialogue
      expect(result.match(/"/g)).toHaveLength(4);
    });

    it('should handle dialogue within narrative paragraphs', () => {
      const input = `The room fell silent.\n\nShe said, The secret is hidden in the library.\n\nEveryone gasped.`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>The room fell silent.</p>\n<p>She said, "The secret is hidden in the library."</p>\n<p>Everyone gasped.</p>');
      expect(result).toContain('"The secret is hidden in the library."');
    });
  });

  describe('Visual organization for readability', () => {
    it('should normalize excessive whitespace while preserving story structure', () => {
      const input = `   The story begins here.   \n\n\n\n   Multiple    spaces   everywhere.   \n\n   The conclusion.   `;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>The story begins here.</p>\n<p>Multiple spaces everywhere.</p>\n<p>The conclusion.</p>');
      // Verify clean formatting without losing paragraph structure
      expect(result.match(/<p>/g)).toHaveLength(3);
      expect(result).not.toContain('   ');
    });

    it('should handle mixed line breaks consistently', () => {
      const input = `First paragraph.\n\n\nSecond paragraph with extra breaks.\n\nThird paragraph.`;
      const result = formatAIResponse(input, storytellingOptions);
      
      expect(result).toBe('<p>First paragraph.</p>\n<p>Second paragraph with extra breaks.</p>\n<p>Third paragraph.</p>');
      // Should normalize to consistent paragraph structure
      expect(result.match(/<p>/g)).toHaveLength(3);
    });

    it('should organize long narrative content for easy reading', () => {
      const longNarrative = `The ancient castle loomed before them. Its towers reached toward the storm clouds gathering overhead.\n\nThe drawbridge creaked as it lowered. The guard called out, State your business!\n\nThe leader stepped forward. She declared, We seek audience with the *Dark Lord*.\n\nA chill wind swept across the courtyard. Their fate would soon be decided.`;
      
      const result = formatAIResponse(longNarrative, storytellingOptions);
      
      expect(result).toContain('The ancient castle loomed before them.');
      expect(result).toContain('"State your business!"');
      expect(result).toContain('She declared, "We seek audience with the <em>Dark Lord</em>."');
      expect(result).toContain('Their fate would soon be decided.');
      
      // Verify all formatting works together
      expect(result.match(/<p>/g)).toHaveLength(4);
      expect(result.match(/"/g)).toHaveLength(4);
      expect(result.match(/<em>/g)).toHaveLength(1);
    });
  });

  describe('Consistency across narrative segments', () => {
    it('should apply consistent formatting regardless of content length', () => {
      const shortContent = `He said, Hello.`;
      const longContent = `The conversation continued for hours. He said, This is a much longer piece of dialogue that should still be formatted correctly. The listener nodded thoughtfully.`;
      
      const shortResult = formatAIResponse(shortContent, storytellingOptions);
      const longResult = formatAIResponse(longContent, storytellingOptions);
      
      expect(shortResult).toBe('<p>He said, "Hello."</p>');
      expect(longResult).toBe('<p>The conversation continued for hours. He said, "This is a much longer piece of dialogue that should still be formatted correctly." The listener nodded thoughtfully.</p>');
      
      // Both should have proper dialogue formatting
      expect(shortResult).toContain('"Hello."');
      expect(longResult).toContain('"This is a much longer piece of dialogue that should still be formatted correctly."');
    });

    it('should maintain storytelling quality with complex nested content', () => {
      const complexContent = `The *mysterious* stranger approached.\n\nHe said, I bring news from the *distant* kingdom. The situation is dire.\n\nShe replied, Tell me everything you know.\n\nThe fate of the realm hung in the balance.`;
      
      const result = formatAIResponse(complexContent, storytellingOptions);
      
      expect(result).toBe('<p>The <em>mysterious</em> stranger approached.</p>\n<p>He said, "I bring news from the <em>distant</em> kingdom." The situation is dire.</p>\n<p>She replied, "Tell me everything you know."</p>\n<p>The fate of the realm hung in the balance.</p>');
      
      // Verify all formatting features work together seamlessly
      expect(result.match(/<em>/g)).toHaveLength(2);
      expect(result.match(/"/g)).toHaveLength(4);
      expect(result.match(/<p>/g)).toHaveLength(4);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty content gracefully', () => {
      expect(formatAIResponse('', storytellingOptions)).toBe('');
      expect(formatAIResponse(null, storytellingOptions)).toBe('');
      expect(formatAIResponse(undefined, storytellingOptions)).toBe('');
    });

    it('should handle content with no formatting needs', () => {
      const plainContent = 'This is just plain narrative text with no special formatting.';
      const result = formatAIResponse(plainContent, storytellingOptions);
      
      expect(result).toBe('<p>This is just plain narrative text with no special formatting.</p>');
    });

    it('should handle malformed dialogue gracefully', () => {
      const malformedDialogue = 'He said without ending punctuation';
      const result = formatAIResponse(malformedDialogue, storytellingOptions);
      
      expect(result).toBe('<p>He said without ending punctuation</p>');
    });

    it('should handle unmatched emphasis markers', () => {
      const unmatchedEmphasis = 'This has *unmatched emphasis';
      const result = formatAIResponse(unmatchedEmphasis, storytellingOptions);
      
      expect(result).toBe('<p>This has *unmatched emphasis</p>');
      // Should not process incomplete emphasis
      expect(result).not.toContain('<em>');
    });
  });
});