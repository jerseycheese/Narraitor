// src/lib/promptTemplates/templates/__tests__/endingTemplates.fatalContext.test.ts

import { prepareEndingTemplateVariables } from '../endingTemplates';

describe('endingTemplates - Fatal Context Injection', () => {
  const mockWorld = {
    name: 'Test World',
    description: 'A dangerous realm'
  };

  const mockCharacter = {
    name: 'Test Hero',
    class: 'Warrior',
    level: 5,
    background: 'A brave soul',
    personality: 'Courageous',
    goals: 'Survive the darkness'
  };

  const mockNarrative = ['The hero faced impossible odds', 'Death came swiftly'];
  const mockJournal = ['Day 1: Started journey', 'Day 2: Everything went wrong'];

  describe('when desiredTone is "tragic"', () => {
    it('injects CRITICAL INSTRUCTION fatal context into customPrompt', () => {
      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        undefined,
        'tragic'
      );

      expect(result.customPrompt).toContain('⚠️ CRITICAL INSTRUCTION - FATAL OUTCOME ⚠️');
      expect(result.customPrompt).toContain('The character has DIED or is INCAPACITATED');
      expect(result.customPrompt).toContain('The character CANNOT continue their journey');
      expect(result.customPrompt).toContain('Use ONLY past tense');
      expect(result.customPrompt).toContain('DO NOT use future tense');
      expect(result.customPrompt).toContain('The story is OVER');
    });

    it('appends fatal context to existing customPrompt', () => {
      const existingPrompt = 'Make it extra dramatic';

      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        existingPrompt,
        'tragic'
      );

      expect(result.customPrompt).toContain(existingPrompt);
      expect(result.customPrompt).toContain('⚠️ CRITICAL INSTRUCTION - FATAL OUTCOME ⚠️');
    });

    it('includes all standard template variables', () => {
      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        undefined,
        'tragic'
      );

      expect(result.worldName).toBe('Test World');
      expect(result.characterName).toBe('Test Hero');
      expect(result.characterClass).toBe('Warrior');
      expect(result.characterLevel).toBe(5);
      expect(result.endingType).toBe('story-complete');
    });
  });

  describe('when desiredTone is NOT "tragic"', () => {
    it('does not inject fatal context for "hopeful" tone', () => {
      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        undefined,
        'hopeful'
      );

      expect(result.customPrompt).not.toContain('⚠️ CRITICAL INSTRUCTION');
      expect(result.customPrompt).not.toContain('FATAL OUTCOME');
      expect(result.customPrompt).toBe('No additional instructions.');
    });

    it('does not inject fatal context for "triumphant" tone', () => {
      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        undefined,
        'triumphant'
      );

      expect(result.customPrompt).not.toContain('FATAL OUTCOME');
    });

    it('does not inject fatal context when desiredTone is undefined', () => {
      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        undefined,
        undefined
      );

      expect(result.customPrompt).toBe('No additional instructions.');
    });
  });

  describe('edge cases', () => {
    it('handles empty narrative and journal gracefully with tragic tone', () => {
      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        [],
        [],
        undefined,
        'tragic'
      );

      expect(result.customPrompt).toContain('⚠️ CRITICAL INSTRUCTION');
      expect(result.recentNarrative).toBe('');
      expect(result.journalEntries).toBe('No significant events recorded in journal.');
    });

    it('preserves custom prompt with tragic context injection', () => {
      const customPrompt = 'Focus on the emotional impact of the final battle';

      const result = prepareEndingTemplateVariables(
        mockWorld,
        mockCharacter,
        'story-complete',
        mockNarrative,
        mockJournal,
        customPrompt,
        'tragic'
      );

      // Should contain both the custom prompt and the fatal context
      expect(result.customPrompt).toContain(customPrompt);
      expect(result.customPrompt).toContain('⚠️ CRITICAL INSTRUCTION');
      expect(result.customPrompt).toContain('FATAL OUTCOME');
    });
  });
});
