/**
 * MVP-level tests for attributeSkillFormatter
 * Focus on core acceptance criteria: converting numeric values to descriptive labels
 */

import {
  normalizeAttributeArray,
  normalizeSkillArray,
  getAttributeDescriptor,
  getSkillDescriptor,
  formatAttributesForNarrative,
  formatSkillsForNarrative
} from '../attributeSkillFormatter';

describe('attributeSkillFormatter - MVP Tests', () => {
  describe('normalizeAttributeArray', () => {
    test('converts Record format to array format', () => {
      const recordFormat = { strength: 8, intelligence: 6 };
      const result = normalizeAttributeArray(recordFormat);

      expect(result).toEqual([
        { attributeId: 'strength', value: 8 },
        { attributeId: 'intelligence', value: 6 }
      ]);
    });

    test('passes through array format unchanged', () => {
      const arrayFormat = [
        { attributeId: 'attr-strength', value: 8 },
        { attributeId: 'attr-intelligence', value: 6 }
      ];
      const result = normalizeAttributeArray(arrayFormat);

      expect(result).toEqual(arrayFormat);
    });

    test('handles empty input', () => {
      expect(normalizeAttributeArray({})).toEqual([]);
      expect(normalizeAttributeArray([])).toEqual([]);
    });
  });

  describe('normalizeSkillArray', () => {
    // The label goes into a prompt, so the readable name wins over the world id.
    test('normalizes skills with name property to skillId format', () => {
      const nameFormat = [
        { name: 'Lockpicking', level: 7, worldSkillId: 'skill-lockpicking' },
        { name: 'Stealth', level: 5 }
      ];
      const result = normalizeSkillArray(nameFormat);

      expect(result).toEqual([
        { skillId: 'Lockpicking', level: 7 },
        { skillId: 'Stealth', level: 5 }
      ]);
    });

    test('passes through skillId format unchanged', () => {
      const skillIdFormat = [
        { skillId: 'skill-lockpicking', level: 7 },
        { skillId: 'skill-stealth', level: 5 }
      ];
      const result = normalizeSkillArray(skillIdFormat);

      expect(result).toEqual(skillIdFormat);
    });

    test('handles empty input', () => {
      expect(normalizeSkillArray([])).toEqual([]);
    });
  });

  describe('getAttributeDescriptor', () => {
    test('returns "Exceptional" for values 9-10', () => {
      expect(getAttributeDescriptor(9)).toBe('Exceptional');
      expect(getAttributeDescriptor(10)).toBe('Exceptional');
    });

    test('returns "High" for values 7-8', () => {
      expect(getAttributeDescriptor(7)).toBe('High');
      expect(getAttributeDescriptor(8)).toBe('High');
    });

    test('returns "Moderate" for values 4-6', () => {
      expect(getAttributeDescriptor(4)).toBe('Moderate');
      expect(getAttributeDescriptor(5)).toBe('Moderate');
      expect(getAttributeDescriptor(6)).toBe('Moderate');
    });

    test('returns "Low" for values 2-3', () => {
      expect(getAttributeDescriptor(2)).toBe('Low');
      expect(getAttributeDescriptor(3)).toBe('Low');
    });

    test('returns "Very Low" for value 1', () => {
      expect(getAttributeDescriptor(1)).toBe('Very Low');
    });

    test('handles edge cases with default', () => {
      expect(getAttributeDescriptor(0)).toBe('Moderate');
      expect(getAttributeDescriptor(11)).toBe('Moderate');
      expect(getAttributeDescriptor(-1)).toBe('Moderate');
    });
  });

  describe('getSkillDescriptor', () => {
    test('returns "Master" for level 5', () => {
      expect(getSkillDescriptor(5)).toBe('Master');
    });

    test('returns "Expert" for level 4', () => {
      expect(getSkillDescriptor(4)).toBe('Expert');
    });

    test('returns "Competent" for level 3', () => {
      expect(getSkillDescriptor(3)).toBe('Competent');
    });

    test('returns "Apprentice" for level 2', () => {
      expect(getSkillDescriptor(2)).toBe('Apprentice');
    });

    test('returns "Novice" for level 1', () => {
      expect(getSkillDescriptor(1)).toBe('Novice');
    });

    test('clamps out-of-range values to 1-5', () => {
      expect(getSkillDescriptor(0)).toBe('Novice'); // Clamps to 1
      expect(getSkillDescriptor(10)).toBe('Master'); // Clamps to 5
      expect(getSkillDescriptor(-1)).toBe('Novice'); // Clamps to 1
    });

    test('rounds fractional values', () => {
      expect(getSkillDescriptor(3.4)).toBe('Competent'); // Rounds to 3
      expect(getSkillDescriptor(3.6)).toBe('Expert'); // Rounds to 4
    });
  });

  describe('formatAttributesForNarrative', () => {
    test('formats notable attributes with descriptive labels', () => {
      const attributes = [
        { attributeId: 'intelligence', value: 9 },
        { attributeId: 'strength', value: 3 },
        { attributeId: 'dexterity', value: 5 }
      ];

      const result = formatAttributesForNarrative(attributes);

      // Should only include notable attributes (not moderate)
      expect(result).toContain('intelligence (Exceptional)');
      expect(result).toContain('strength (Low)');
      expect(result).not.toContain('dexterity');
    });

    test('handles empty attributes', () => {
      expect(formatAttributesForNarrative([])).toBe('');
    });

    test('filters out moderate attributes', () => {
      const attributes = [
        { attributeId: 'charisma', value: 5 },
        { attributeId: 'wisdom', value: 6 }
      ];

      const result = formatAttributesForNarrative(attributes);
      expect(result).toBe('');
    });

    test('formats Record-style attributes', () => {
      const attributes = { intelligence: 9, strength: 3 };
      const result = formatAttributesForNarrative(attributes);

      expect(result).toContain('intelligence (Exceptional)');
      expect(result).toContain('strength (Low)');
    });
  });

  describe('formatSkillsForNarrative', () => {
    test('formats all skills with descriptive labels (1-5 scale)', () => {
      const skills = [
        { skillId: 'lockpicking', level: 4 }, // Expert
        { skillId: 'stealth', level: 2 }      // Apprentice
      ];

      const result = formatSkillsForNarrative(skills);

      expect(result).toContain('lockpicking (Expert)');
      expect(result).toContain('stealth (Apprentice)');
    });

    test('includes all skills regardless of level', () => {
      const skills = [
        { skillId: 'lockpicking', level: 5 }, // Master
        { skillId: 'stealth', level: 1 }      // Novice
      ];

      const result = formatSkillsForNarrative(skills);

      // Both should be included, even low-level skills
      expect(result).toContain('lockpicking (Master)');
      expect(result).toContain('stealth (Novice)');
    });

    test('handles empty skills', () => {
      expect(formatSkillsForNarrative([])).toBe('');
    });

    test('handles name-based skill format', () => {
      const skills = [
        { name: 'Lockpicking', level: 4, worldSkillId: 'skill-lockpicking' },
        { name: 'Stealth', level: 3 }
      ];

      const result = formatSkillsForNarrative(skills);

      expect(result).toContain('Lockpicking (Expert)');
      expect(result).toContain('Stealth (Competent)');
    });
  });
});
