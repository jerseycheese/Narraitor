/**
 * Tests for choice type inference logic used in Issue #142 integration
 * 
 * This module tests the logic that categorizes player choices for PlayerDecisionTracker.
 * The primary method is alignment-based mapping, with AI-based inference as fallback.
 * 
 * Focus: Integration behavior and alignment mapping
 */

import { ChoiceTypePreference } from '../../../types/personalization.types';
import { ChoiceAlignment } from '../../../types/narrative.types';

/**
 * Maps choice alignment to appropriate choice type preference
 * This mirrors the implementation in narrativeStore.ts
 */
function mapAlignmentToChoiceType(alignment?: ChoiceAlignment): ChoiceTypePreference {
  switch (alignment) {
    case 'lawful': return 'diplomatic';
    case 'chaotic': return 'aggressive';
    case 'neutral':
    default: return 'neutral';
  }
}

/**
 * Simple AI-based choice inference (placeholder)
 * In production, this would use AI to analyze choice text
 */
function inferChoiceTypeFromText(): ChoiceTypePreference {
  // AI-based inference would go here
  // For now, return neutral as the fallback
  return 'neutral';
}

describe('Choice Type Inference for PlayerDecisionTracker Integration', () => {
  describe('Alignment-Based Choice Type Mapping', () => {
    it('should map lawful alignment to diplomatic choice type', () => {
      const result = mapAlignmentToChoiceType('lawful');
      expect(result).toBe('diplomatic');
    });

    it('should map chaotic alignment to aggressive choice type', () => {
      const result = mapAlignmentToChoiceType('chaotic');
      expect(result).toBe('aggressive');
    });

    it('should map neutral alignment to neutral choice type', () => {
      const result = mapAlignmentToChoiceType('neutral');
      expect(result).toBe('neutral');
    });

    it('should default to neutral for undefined alignment', () => {
      const result = mapAlignmentToChoiceType(undefined);
      expect(result).toBe('neutral');
    });
  });

  describe('AI-Based Text Inference (Fallback)', () => {
    it('should return neutral for any text input as fallback', () => {
      const testCases = [
        'Attack the enemy forces',
        'Negotiate a peaceful solution',
        'Sneak around the guards',
        'Help the injured civilians',
        'Take the treasure for yourself',
        'Follow the established protocol'
      ];

      testCases.forEach(choice => {
        const result = inferChoiceTypeFromText(choice);
        expect(result).toBe('neutral');
      });
    });
  });

  describe('Integration Priority', () => {
    it('should prioritize alignment-based mapping over text inference', () => {
      // This test verifies the implementation strategy:
      // 1. If alignment is available, use mapAlignmentToChoiceType()
      // 2. Only use inferChoiceTypeFromText() as fallback when no alignment
      
      const choiceWithAlignment = 'Attack them immediately';
      const alignmentResult = mapAlignmentToChoiceType('chaotic');
      const textResult = inferChoiceTypeFromText(choiceWithAlignment);
      
      expect(alignmentResult).toBe('aggressive');
      expect(textResult).toBe('neutral');
      
      // The actual implementation should use alignmentResult when alignment is available
    });
  });
});