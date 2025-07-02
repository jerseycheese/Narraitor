// src/lib/utils/__tests__/textFormatter.readable-storytelling.test.ts

import { formatAIResponse, FormattingOptions } from '../textFormatter';

describe('Text Formatting for Readable Storytelling (Issue #231)', () => {
  describe('Paragraph Break Formatting', () => {
    test('should format narrative text with standard paragraph breaks', () => {
      const rawNarrative = 'The ancient forest was silent.\n\nSuddenly, a twig snapped behind them.\n\nThey turned slowly, heart pounding.';
      const result = formatAIResponse(rawNarrative);
      
      expect(result).toBe('The ancient forest was silent.\n\nSuddenly, a twig snapped behind them.\n\nThey turned slowly, heart pounding.');
      expect(result.split('\n\n')).toHaveLength(3); // Three distinct paragraphs
    });

    test('should normalize inconsistent paragraph breaks in storytelling text', () => {
      const messyNarrative = 'The hero entered the tavern.\n\n\n\nThe barkeeper looked up nervously.\n\n\n\n\n"What brings you here?" he asked.';
      const result = formatAIResponse(messyNarrative, { formatDialogue: true });
      
      // Should normalize to exactly two line breaks between paragraphs
      expect(result).toContain('The hero entered the tavern.\n\nThe barkeeper looked up nervously.\n\n"What brings you here?" he asked.');
      expect(result).not.toContain('\n\n\n'); // No triple line breaks
    });

    test('should handle mixed content with paragraphs and dialogue', () => {
      const mixedContent = 'The room was eerily quiet.\n\nShe said, I hear something.\n\nFootsteps echoed down the hallway.';
      const result = formatAIResponse(mixedContent, { formatDialogue: true });
      
      expect(result).toContain('She said, "I hear something."');
      expect(result.split('\n\n')).toHaveLength(3);
    });
  });

  describe('Dialogue Formatting for Storytelling', () => {
    test('should format dialogue with proper quotation marks and attribution', () => {
      const dialogueText = 'The wizard said, Magic is not to be taken lightly.';
      const result = formatAIResponse(dialogueText, { formatDialogue: true });
      
      expect(result).toBe('The wizard said, "Magic is not to be taken lightly."');
    });

    test('should handle multiple speakers in narrative dialogue', () => {
      const conversationText = 'She whispered, We must be careful. He replied, I know the way.';
      const result = formatAIResponse(conversationText, { formatDialogue: true });
      
      expect(result).toContain('She whispered, "We must be careful."');
      expect(result).toContain('He replied, "I know the way."');
    });

    test('should preserve already-quoted dialogue in narrative', () => {
      const quotedDialogue = 'The guard announced, "None shall pass!" with authority.';
      const result = formatAIResponse(quotedDialogue, { formatDialogue: true });
      
      expect(result).toBe('The guard announced, "None shall pass!" with authority.');
      expect(result.match(/"/g)?.length).toBe(2); // Should have exactly 2 quotes
    });

    test('should handle dialogue with various speech verbs', () => {
      const speechText = 'She exclaimed, This is amazing! Then he muttered, If you say so.';
      const result = formatAIResponse(speechText, { formatDialogue: true });
      
      expect(result).toContain('She exclaimed, "This is amazing!"');
      expect(result).toContain('he muttered, "If you say so."');
    });
  });

  describe('Emphasis Formatting for Important Elements', () => {
    test('should format emphasized text for important story elements', () => {
      const storyText = 'The artifact was *ancient beyond measure*, pulsing with *otherworldly energy*.';
      const result = formatAIResponse(storyText, { enableItalics: true });
      
      expect(result).toContain('<em>ancient beyond measure</em>');
      expect(result).toContain('<em>otherworldly energy</em>');
    });

    test('should handle emphasis in combination with dialogue', () => {
      const emphasizedDialogue = 'She said, The *forbidden tome* must never be opened!';
      const result = formatAIResponse(emphasizedDialogue, { formatDialogue: true, enableItalics: true });
      
      expect(result).toBe('She said, "The <em>forbidden tome</em> must never be opened!"');
    });

    test('should maintain emphasis boundaries within paragraphs', () => {
      const paragraphWithEmphasis = 'The castle loomed ahead. Its *massive gates* stood open.\n\nThey stepped through the *threshold of destiny*.';
      const result = formatAIResponse(paragraphWithEmphasis, { enableItalics: true });
      
      expect(result).toContain('<em>massive gates</em>');
      expect(result).toContain('<em>threshold of destiny</em>');
      expect(result.split('\n\n')).toHaveLength(2);
    });
  });

  describe('Visual Organization for Easy Reading', () => {
    test('should organize complex narrative text for readability', () => {
      const complexNarrative = `The chamber was vast and echoing.\n\nThe mage said, Beware the *cursed seal*.\n\nSuddenly, the ground began to shake. Ancient runes *glowed with malevolent light*.\n\nShe whispered, We should leave. Now.`;
      
      const result = formatAIResponse(complexNarrative, {
        formatDialogue: true,
        enableItalics: true
      });
      
      // Should have proper paragraph structure
      const paragraphs = result.split('\n\n');
      expect(paragraphs).toHaveLength(4);
      
      // Should have formatted dialogue
      expect(result).toContain('The mage said, "Beware the <em>cursed seal</em>."');
      expect(result).toContain('She whispered, "We should leave. Now."');
      
      // Should have emphasis formatting
      expect(result).toContain('<em>glowed with malevolent light</em>');
    });

    test('should maintain consistent formatting across long narrative segments', () => {
      const longNarrative = 'Paragraph one with *emphasis*.\n\nShe said, Important dialogue here.\n\nParagraph three continues.\n\nHe replied, More conversation.\n\nFinal paragraph with *more emphasis*.';
      
      const result = formatAIResponse(longNarrative, {
        formatDialogue: true,
        enableItalics: true
      });
      
      // All formatting should be consistently applied
      expect(result).toContain('<em>emphasis</em>');
      expect(result).toContain('<em>more emphasis</em>');
      expect(result).toContain('She said, "Important dialogue here."');
      expect(result).toContain('He replied, "More conversation."');
      
      // Should maintain paragraph structure
      expect(result.split('\n\n')).toHaveLength(5);
    });
  });

  describe('Consistency Across Narrative Segments', () => {
    test('should apply consistent formatting to different types of narrative content', () => {
      const actionScene = 'The battle raged. She shouted, *For honor!*';
      const dialogueScene = 'In the quiet library, he whispered, The *ancient secrets* are here.';
      const descriptionScene = 'The *mystical portal* shimmered.\n\nBeyond it lay *infinite possibilities*.';
      
      const options: FormattingOptions = { formatDialogue: true, enableItalics: true };
      
      const actionResult = formatAIResponse(actionScene, options);
      const dialogueResult = formatAIResponse(dialogueScene, options);
      const descriptionResult = formatAIResponse(descriptionScene, options);
      
      // All should have consistent emphasis formatting
      expect(actionResult).toContain('<em>For honor!</em>');
      expect(dialogueResult).toContain('<em>ancient secrets</em>');
      expect(descriptionResult).toContain('<em>mystical portal</em>');
      expect(descriptionResult).toContain('<em>infinite possibilities</em>');
      
      // All should have consistent dialogue formatting
      expect(actionResult).toContain('She shouted, "<em>For honor!</em>"');
      expect(dialogueResult).toContain('he whispered, "The <em>ancient secrets</em> are here."');
    });

    test('should handle edge cases in storytelling format consistently', () => {
      const edgeCaseText = 'Text with trailing spaces.   \n\n   She said, Multiple   spaces   here.\n\n*Emphasis* at start and end *emphasis*.';
      
      const result = formatAIResponse(edgeCaseText, {
        formatDialogue: true,
        enableItalics: true
      });
      
      // Should normalize whitespace consistently
      expect(result).not.toContain('   ');
      expect(result).toContain('She said, "Multiple spaces here."');
      expect(result).toContain('<em>Emphasis</em> at start and end <em>emphasis</em>');
    });
  });
});
