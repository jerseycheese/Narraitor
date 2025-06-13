import { validateToneSettings, validateToneSettingsCompatibility } from '../toneSettingsValidation';
import { ToneSettings } from '@/types/tone-settings.types';

describe('toneSettingsValidation', () => {
  describe('validateToneSettings', () => {
    test('validates complete valid tone settings', () => {
      const validSettings: ToneSettings = {
        contentRating: 'PG',
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate',
        customInstructions: 'Keep it engaging'
      };

      const result = validateToneSettings(validSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates minimal valid tone settings', () => {
      const minimalSettings: ToneSettings = {
        contentRating: 'G',
        narrativeStyle: 'balanced',
        languageComplexity: 'simple'
      };

      const result = validateToneSettings(minimalSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('fails validation for missing content rating', () => {
      const invalidSettings = {
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate'
      } as Partial<ToneSettings>;

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content Rating is required');
    });

    test('fails validation for invalid content rating', () => {
      const invalidSettings = {
        contentRating: 'INVALID',
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate'
      } as any;

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content Rating must be a valid rating');
    });

    test('fails validation for missing narrative style', () => {
      const invalidSettings = {
        contentRating: 'PG',
        languageComplexity: 'moderate'
      } as Partial<ToneSettings>;

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Narrative Style is required');
    });

    test('fails validation for invalid narrative style', () => {
      const invalidSettings = {
        contentRating: 'PG',
        narrativeStyle: 'invalid-style',
        languageComplexity: 'moderate'
      } as any;

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Narrative Style must be a valid style');
    });

    test('fails validation for missing language complexity', () => {
      const invalidSettings = {
        contentRating: 'PG',
        narrativeStyle: 'dramatic'
      } as Partial<ToneSettings>;

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Language Complexity is required');
    });

    test('fails validation for invalid language complexity', () => {
      const invalidSettings = {
        contentRating: 'PG',
        narrativeStyle: 'dramatic',
        languageComplexity: 'invalid-complexity'
      } as any;

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Language Complexity must be a valid level');
    });

    test('fails validation for overly long custom instructions', () => {
      const longInstructions = 'a'.repeat(501);
      const invalidSettings: ToneSettings = {
        contentRating: 'PG',
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate',
        customInstructions: longInstructions
      };

      const result = validateToneSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Custom Instructions must be no more than 500 characters');
    });

    test('passes validation for custom instructions at character limit', () => {
      const maxInstructions = 'a'.repeat(500);
      const validSettings: ToneSettings = {
        contentRating: 'PG',
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate',
        customInstructions: maxInstructions
      };

      const result = validateToneSettings(validSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateToneSettingsCompatibility', () => {
    test('passes for compatible horror theme with appropriate rating', () => {
      const toneSettings: ToneSettings = {
        contentRating: 'R',
        narrativeStyle: 'dramatic',
        languageComplexity: 'advanced'
      };

      const result = validateToneSettingsCompatibility(toneSettings, 'Horror');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('fails for horror theme with family-friendly rating', () => {
      const toneSettings: ToneSettings = {
        contentRating: 'G',
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate'
      };

      const result = validateToneSettingsCompatibility(toneSettings, 'Horror');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Horror themes typically require higher content ratings');
    });

    test('fails for children theme with mature rating', () => {
      const toneSettings: ToneSettings = {
        contentRating: 'R',
        narrativeStyle: 'lighthearted',
        languageComplexity: 'simple'
      };

      const result = validateToneSettingsCompatibility(toneSettings, 'Children');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Children\'s themes should use family-friendly content ratings');
    });

    test('passes for compatible children theme', () => {
      const toneSettings: ToneSettings = {
        contentRating: 'G',
        narrativeStyle: 'lighthearted',
        languageComplexity: 'simple'
      };

      const result = validateToneSettingsCompatibility(toneSettings, 'Children');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('handles case-insensitive theme matching', () => {
      const toneSettings: ToneSettings = {
        contentRating: 'G',
        narrativeStyle: 'dramatic',
        languageComplexity: 'moderate'
      };

      const result = validateToneSettingsCompatibility(toneSettings, 'HORROR');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Horror themes typically require higher content ratings');
    });
  });
});