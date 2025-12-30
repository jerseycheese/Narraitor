/**
 * MVP-level tests for Attribute Narrative Enhancer
 * Focus on adding contextual attribute-aware flavor text to narratives
 */

import {
  getAttributeFlavorText,
  enhanceNarrativeWithAttributes,
  AttributeContext
} from '../attributeNarrativeEnhancer';

describe('attributeNarrativeEnhancer - MVP Tests', () => {
  describe('getAttributeFlavorText', () => {
    test('returns high intelligence flavor text', () => {
      const context: AttributeContext = {
        attributeId: 'intelligence',
        descriptor: 'Exceptional',
        situation: 'observation'
      };

      const result = getAttributeFlavorText(context);

      expect(result).toBeTruthy();
      expect(result).toMatch(/intellect|mind|analysis|thought|insight|understanding/i);
    });

    test('returns high dexterity flavor text', () => {
      const context: AttributeContext = {
        attributeId: 'dexterity',
        descriptor: 'Exceptional',
        situation: 'action'
      };

      const result = getAttributeFlavorText(context);

      expect(result).toBeTruthy();
      expect(result).toMatch(/agil|nimble|quick|swift/i);
    });

    test('returns low strength flavor text', () => {
      const context: AttributeContext = {
        attributeId: 'strength',
        descriptor: 'Low',
        situation: 'challenge'
      };

      const result = getAttributeFlavorText(context);

      expect(result).toBeTruthy();
      expect(result).toMatch(/strain|struggle|effort|weaken|limited|weight|challenging/i);
    });

    test('returns empty string for moderate descriptor', () => {
      const context: AttributeContext = {
        attributeId: 'strength',
        descriptor: 'Moderate',
        situation: 'action'
      };

      const result = getAttributeFlavorText(context);

      expect(result).toBe('');
    });

    test('handles unknown attribute gracefully', () => {
      const context: AttributeContext = {
        attributeId: 'unknown-attr',
        descriptor: 'High',
        situation: 'observation'
      };

      const result = getAttributeFlavorText(context);

      // Should return empty or generic text
      expect(typeof result).toBe('string');
    });
  });

  describe('enhanceNarrativeWithAttributes', () => {
    test('adds attribute flavor text to narrative', () => {
      const narrative = 'You examine the ancient lock carefully.';
      const attributes = [
        { attributeId: 'intelligence', value: 9 }
      ];

      const result = enhanceNarrativeWithAttributes(narrative, attributes);

      // Should contain original narrative
      expect(result).toContain('ancient lock');

      // Should add intelligence-based flavor
      expect(result).not.toBe(narrative); // Should be enhanced
      expect(result.length).toBeGreaterThan(narrative.length);
    });

    test('does not modify narrative when no notable attributes', () => {
      const narrative = 'You walk down the path.';
      const attributes = [
        { attributeId: 'strength', value: 5 } // Moderate - filtered out
      ];

      const result = enhanceNarrativeWithAttributes(narrative, attributes);

      expect(result).toBe(narrative);
    });

    test('handles multiple notable attributes', () => {
      const narrative = 'You approach the locked door.';
      const attributes = [
        { attributeId: 'intelligence', value: 8 },
        { attributeId: 'dexterity', value: 9 }
      ];

      const result = enhanceNarrativeWithAttributes(narrative, attributes);

      // Should be enhanced but not contain both (randomly picks one)
      expect(result.length).toBeGreaterThanOrEqual(narrative.length);
    });

    test('handles empty attributes', () => {
      const narrative = 'You continue your journey.';
      const attributes: Array<{ attributeId: string; value: number }> = [];

      const result = enhanceNarrativeWithAttributes(narrative, attributes);

      expect(result).toBe(narrative);
    });

    test('handles Record-style attributes', () => {
      const narrative = 'You notice something unusual.';
      const attributes = { intelligence: 9, strength: 3 };

      const result = enhanceNarrativeWithAttributes(narrative, attributes);

      // Should handle Record format
      expect(typeof result).toBe('string');
    });

    test('does not add flavor to very short narratives', () => {
      const narrative = 'You proceed.';
      const attributes = [
        { attributeId: 'intelligence', value: 9 }
      ];

      const result = enhanceNarrativeWithAttributes(narrative, attributes);

      // Too short to enhance naturally
      expect(result).toBe(narrative);
    });
  });
});
