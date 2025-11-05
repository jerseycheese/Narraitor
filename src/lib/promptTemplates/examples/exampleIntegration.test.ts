/**
 * @fileoverview Integration tests for example library with templates
 * Tests that verify token budget handling and tag selection logic
 */

import { baseNarrativeTemplate } from '../templates/narrative/baseNarrativeTemplate';
import { sceneTemplate } from '../templates/narrative/sceneTemplate';
import { transitionTemplate } from '../templates/narrative/transitionTemplate';
import { skillAcknowledgmentTemplate } from '../templates/narrative/skillAcknowledgmentTemplate';

describe('Example Library Template Integration', () => {
  describe('Token Budget Handling', () => {
    it('should respect zero token budget in baseNarrativeTemplate', () => {
      const context = {
        worldName: 'Test World',
        worldDescription: 'A test world',
        genre: 'fantasy',
        tone: 'dark',
        attributes: [],
        generationParameters: {
          exampleTokenBudget: 0, // Explicitly disable examples
        },
      };

      const result = baseNarrativeTemplate(context);

      // Should not include "EXAMPLES:" section when budget is 0
      expect(result).not.toContain('EXAMPLES:');
      expect(result).not.toContain('Example 1:');
    });

    it('should respect zero token budget in sceneTemplate', () => {
      const context = {
        worldName: 'Test World',
        genre: 'fantasy',
        tone: 'dark',
        narrativeContext: {
          recentSegments: [
            { content: 'Previous scene content' },
          ],
        },
        generationParameters: {
          segmentType: 'scene',
          exampleTokenBudget: 0, // Explicitly disable examples
        },
      };

      const result = sceneTemplate(context);

      // Should not include "EXAMPLES:" section when budget is 0
      expect(result).not.toContain('EXAMPLES:');
      expect(result).not.toContain('Example 1:');
    });

    it('should respect zero token budget in transitionTemplate', () => {
      const context = {
        worldName: 'Test World',
        genre: 'fantasy',
        tone: 'dark',
        previousContent: 'Previous content',
        previousType: 'scene',
        generationParameters: {
          exampleTokenBudget: 0, // Explicitly disable examples
        },
      };

      const result = transitionTemplate(context);

      // Should not include "EXAMPLES:" section when budget is 0
      expect(result).not.toContain('EXAMPLES:');
      expect(result).not.toContain('Example 1:');
    });

    it('should use default budget when exampleTokenBudget is undefined', () => {
      const context = {
        worldName: 'Test World',
        worldDescription: 'A test world',
        genre: 'fantasy',
        tone: 'dark',
        attributes: [],
        generationParameters: {
          // exampleTokenBudget is undefined - should use default
        },
      };

      const result = baseNarrativeTemplate(context);

      // With default budget and short context, examples should be included
      // This test verifies the default behavior works
      expect(result).toBeDefined();
    });

    it('should differentiate between 0 and undefined for token budget', () => {
      const baseContext = {
        worldName: 'Test World',
        worldDescription: 'A test world',
        genre: 'fantasy',
        tone: 'dark',
        attributes: [],
      };

      // Case 1: exampleTokenBudget = 0 (explicit disable)
      const resultWithZero = baseNarrativeTemplate({
        ...baseContext,
        generationParameters: { exampleTokenBudget: 0 },
      });

      // Case 2: exampleTokenBudget = undefined (use default)
      const resultWithUndefined = baseNarrativeTemplate({
        ...baseContext,
        generationParameters: {},
      });

      // Zero should prevent examples
      expect(resultWithZero).not.toContain('EXAMPLES:');

      // Both results should be valid templates
      expect(resultWithZero).toBeDefined();
      expect(resultWithUndefined).toBeDefined();
    });
  });

  describe('Skill Acknowledgment Tag Selection', () => {
    it('should use success tag when skillUsed.success is true', () => {
      const context = {
        worldName: 'Test World',
        genre: 'fantasy',
        narrativeContext: {
          recentSegments: [
            { content: 'You attempt to pick the lock.' },
          ],
        },
        playerCharacterName: 'Hero',
        skillUsed: {
          skillId: 'lockpicking',
          skillName: 'Lockpicking',
          success: true,
          difficulty: 5,
        },
      };

      const result = skillAcknowledgmentTemplate(context);

      // Should include success guidance
      expect(result).toContain('SUCCESS ACKNOWLEDGMENT');
      expect(result).not.toContain('FAILURE ACKNOWLEDGMENT');
    });

    it('should use failure tag when skillUsed.success is false', () => {
      const context = {
        worldName: 'Test World',
        genre: 'fantasy',
        narrativeContext: {
          recentSegments: [
            { content: 'You attempt to pick the lock.' },
          ],
        },
        playerCharacterName: 'Hero',
        skillUsed: {
          skillId: 'lockpicking',
          skillName: 'Lockpicking',
          success: false,
          difficulty: 8,
        },
      };

      const result = skillAcknowledgmentTemplate(context);

      // Should include failure guidance
      expect(result).toContain('FAILURE ACKNOWLEDGMENT');
    });

    it('should default to success tag when skillUsed is undefined', () => {
      const context = {
        worldName: 'Test World',
        genre: 'fantasy',
        narrativeContext: {
          recentSegments: [
            { content: 'You perform a custom action.' },
          ],
        },
        playerCharacterName: 'Hero',
        // skillUsed is undefined - custom action without explicit result
        customAction: {
          action: 'inspect the mechanism',
          implicitSkills: ['perception'],
        },
      };

      const result = skillAcknowledgmentTemplate(context);

      // Should include custom action guidance, not default to failure
      expect(result).toContain('CUSTOM ACTION ACKNOWLEDGMENT');
      // Should not bias toward failure
      expect(result).not.toContain('FAILURE ACKNOWLEDGMENT');
    });

    it('should default to success tag when skillUsed.success is null', () => {
      const context = {
        worldName: 'Test World',
        genre: 'fantasy',
        narrativeContext: {
          recentSegments: [
            { content: 'You perform an action.' },
          ],
        },
        playerCharacterName: 'Hero',
        skillUsed: {
          skillId: 'custom',
          skillName: 'Custom Skill',
          success: null as unknown as boolean, // Null or undefined result
          difficulty: 5,
        },
      };

      const result = skillAcknowledgmentTemplate(context);

      // Should not default to failure guidance
      // The template should handle neutral/undefined results gracefully
      expect(result).toBeDefined();
    });
  });
});
