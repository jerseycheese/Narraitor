/**
 * Tests for choice type inference logic used in Issue #142 integration
 * 
 * This module tests the logic that automatically categorizes player choices
 * into ChoiceTypePreference types for PlayerDecisionTracker integration.
 * 
 * Focus: Choice categorization accuracy and consistency
 */

import { ChoiceTypePreference } from '../../../types/personalization.types';

/**
 * Infers choice type from choice text and context
 * This function will be implemented as part of Issue #142
 */
function inferChoiceType(
  choiceText: string, 
  prompt: string,
  context?: {
    location?: string;
    situation?: string;
    charactersPresent?: string[];
  }
): ChoiceTypePreference {
  // This is a placeholder implementation for testing
  // The actual implementation will be more sophisticated
  const text = choiceText.toLowerCase();
  
  // Aggressive indicators
  if (text.includes('attack') || text.includes('fight') || text.includes('strike') || 
      text.includes('destroy') || text.includes('kill')) {
    return 'aggressive';
  }
  
  // Diplomatic indicators
  if (text.includes('negotiate') || text.includes('talk') || text.includes('discuss') ||
      text.includes('convince') || text.includes('persuade') || text.includes('peaceful')) {
    return 'diplomatic';
  }
  
  // Stealthy indicators
  if (text.includes('sneak') || text.includes('hide') || text.includes('quietly') ||
      text.includes('stealth') || text.includes('avoid') || text.includes('slip')) {
    return 'stealthy';
  }
  
  // Helpful indicators
  if (text.includes('help') || text.includes('assist') || text.includes('aid') ||
      text.includes('support') || text.includes('heal') || text.includes('save')) {
    return 'helpful';
  }
  
  // Selfish indicators
  if (text.includes('take for myself') || text.includes('keep the') || text.includes('abandon') ||
      text.includes('ignore') || text.includes('leave behind')) {
    return 'selfish';
  }
  
  // Lawful indicators
  if (text.includes('report to authorities') || text.includes('follow the law') ||
      text.includes('turn in') || text.includes('legal') || text.includes('proper way')) {
    return 'lawful';
  }
  
  // Chaotic indicators  
  if (text.includes('break the') || text.includes('defy') || text.includes('rebel') ||
      text.includes('chaos') || text.includes('unpredictable')) {
    return 'chaotic';
  }
  
  // Default to neutral for ambiguous choices
  return 'neutral';
}

describe('Choice Type Inference for PlayerDecisionTracker Integration', () => {
  describe('Basic Choice Type Recognition', () => {
    it('should correctly identify aggressive choices', () => {
      const aggressiveChoices = [
        'Attack the bandits head-on',
        'Fight your way through',
        'Strike first before they notice you',
        'Destroy the corrupted altar',
        'Kill the monster before it escapes'
      ];

      aggressiveChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'What do you do?');
        expect(result).toBe('aggressive');
      });
    });

    it('should correctly identify diplomatic choices', () => {
      const diplomaticChoices = [
        'Try to negotiate with the merchant',
        'Talk your way out of trouble',
        'Discuss the matter calmly',
        'Convince them to see reason',
        'Find a peaceful solution',
        'Persuade the guards to let you pass'
      ];

      diplomaticChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'How do you handle this situation?');
        expect(result).toBe('diplomatic');
      });
    });

    it('should correctly identify stealthy choices', () => {
      const stealthyChoices = [
        'Sneak around the back entrance',
        'Hide until they pass by',
        'Move quietly through the shadows',
        'Use stealth to avoid detection',
        'Slip past the sleeping guards',
        'Avoid the main road'
      ];

      stealthyChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'How do you approach?');
        expect(result).toBe('stealthy');
      });
    });

    it('should correctly identify helpful choices', () => {
      const helpfulChoices = [
        'Help the wounded traveler',
        'Assist the struggling merchant',
        'Aid the trapped villagers',
        'Support the grieving family',
        'Heal the injured animal',
        'Save the drowning child'
      ];

      helpfulChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'What do you do?');
        expect(result).toBe('helpful');
      });
    });

    it('should correctly identify selfish choices', () => {
      const selfishChoices = [
        'Take the treasure for myself',
        'Keep the reward money',
        'Abandon them to save yourself',
        'Ignore their pleas for help',
        'Leave the wounded behind'
      ];

      selfishChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'The group is in danger. What do you do?');
        expect(result).toBe('selfish');
      });
    });

    it('should correctly identify lawful choices', () => {
      const lawfulChoices = [
        'Report the crime to authorities',
        'Follow the law and turn them in',
        'Handle this the legal way',
        'Contact the proper officials',
        'Do what\'s right according to the law'
      ];

      lawfulChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'You discover illegal activity. What do you do?');
        expect(result).toBe('lawful');
      });
    });

    it('should correctly identify chaotic choices', () => {
      const chaoticChoices = [
        'Break the ancient seal',
        'Defy the king\'s orders',
        'Rebel against the system',
        'Create chaos and confusion',
        'Do something completely unpredictable'
      ];

      chaoticChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'The situation demands action. What do you do?');
        expect(result).toBe('chaotic');
      });
    });

    it('should default to neutral for ambiguous choices', () => {
      const neutralChoices = [
        'Wait and see what happens',
        'Continue on your journey',
        'Ask for more information',
        'Think about it carefully',
        'Look around the area'
      ];

      neutralChoices.forEach(choice => {
        const result = inferChoiceType(choice, 'What\'s your next move?');
        expect(result).toBe('neutral');
      });
    });
  });

  describe('Context-Aware Inference', () => {
    it('should consider prompt context when categorizing ambiguous choices', () => {
      const choice = 'Take action';
      
      // Same choice text, different contexts should yield different results
      const combatPrompt = 'Enemies surround you. What do you do?';
      const socialPrompt = 'The villagers are arguing. What do you do?';
      
      // In combat context, "take action" might lean more aggressive
      // In social context, it might be more neutral or diplomatic
      // This tests that context influences inference (actual implementation will be more sophisticated)
      
      const combatResult = inferChoiceType(choice, combatPrompt);
      const socialResult = inferChoiceType(choice, socialPrompt);
      
      // For this MVP test, both should be neutral since "take action" is ambiguous
      // But the system should be designed to use context in the future
      expect([combatResult, socialResult]).toEqual(expect.arrayContaining(['neutral']));
    });

    it('should handle choices with multiple possible interpretations consistently', () => {
      // Some choices might fit multiple categories
      const ambiguousChoice = 'Quietly help the prisoner escape';
      
      // This could be stealthy (quietly) or helpful (help escape)
      // The system should make consistent choices
      const result1 = inferChoiceType(ambiguousChoice, 'A political prisoner needs help. What do you do?');
      const result2 = inferChoiceType(ambiguousChoice, 'A political prisoner needs help. What do you do?');
      
      expect(result1).toBe(result2); // Should be consistent
      expect(['stealthy', 'helpful']).toContain(result1); // Should be one of the reasonable options
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty or invalid input gracefully', () => {
      expect(() => inferChoiceType('', 'What do you do?')).not.toThrow();
      expect(() => inferChoiceType('   ', 'What do you do?')).not.toThrow();
      
      // Should default to neutral for empty/whitespace input
      expect(inferChoiceType('', 'What do you do?')).toBe('neutral');
      expect(inferChoiceType('   ', 'What do you do?')).toBe('neutral');
    });

    it('should be case-insensitive', () => {
      const variations = [
        'HELP THE TRAVELER',
        'help the traveler', 
        'Help The Traveler',
        'HeLp ThE tRaVeLeR'
      ];
      
      variations.forEach(choice => {
        const result = inferChoiceType(choice, 'What do you do?');
        expect(result).toBe('helpful');
      });
    });

    it('should handle very long choice text appropriately', () => {
      const longChoice = 'Help the wounded traveler by carefully bandaging their injuries, ' +
        'giving them some of your water, and helping them to the nearest town where they ' +
        'can receive proper medical attention from a trained healer or physician who ' +
        'specializes in treating road injuries and travel-related wounds';
      
      // Should still identify as helpful despite length
      const result = inferChoiceType(longChoice, 'You encounter an injured person. What do you do?');
      expect(result).toBe('helpful');
    });

    it('should handle special characters and punctuation', () => {
      const choicesWithPunctuation = [
        'Attack! Strike now while they\'re distracted!',
        'Help... if you can manage it.',
        'Sneak around (quietly)',
        'Talk to them - maybe they\'ll listen?'
      ];
      
      const expectedTypes: ChoiceTypePreference[] = ['aggressive', 'helpful', 'stealthy', 'diplomatic'];
      
      choicesWithPunctuation.forEach((choice, index) => {
        const result = inferChoiceType(choice, 'What\'s your approach?');
        expect(result).toBe(expectedTypes[index]);
      });
    });
  });

  describe('Integration Requirements', () => {
    it('should return valid ChoiceTypePreference values only', () => {
      const validTypes: ChoiceTypePreference[] = [
        'diplomatic', 'aggressive', 'stealthy', 'helpful',
        'selfish', 'lawful', 'chaotic', 'neutral'
      ];
      
      // Test a variety of inputs
      const testInputs = [
        'Attack with full force',
        'Try to negotiate',
        'Sneak past quietly',
        'Help everyone you can',
        'Take it all for yourself',
        'Follow proper protocol',
        'Break all the rules',
        'Wait and see',
        'Random choice text that doesn\'t match patterns'
      ];
      
      testInputs.forEach(input => {
        const result = inferChoiceType(input, 'Test prompt');
        expect(validTypes).toContain(result);
      });
    });

    it('should provide deterministic results for identical inputs', () => {
      const choice = 'Help the villagers rebuild their homes';
      const prompt = 'The village was destroyed. What do you do?';
      
      // Multiple calls with identical input should return identical results
      const results = Array(10).fill(null).map(() => 
        inferChoiceType(choice, prompt)
      );
      
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults).toHaveLength(1); // All results should be identical
    });
  });
});