import { validateToneSettings } from '../toneSettingsValidation';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';

describe('validateToneSettings', () => {
  it('accepts the default tone settings', () => {
    expect(validateToneSettings(DEFAULT_TONE_SETTINGS)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('reports one error per missing required field', () => {
    const result = validateToneSettings({});

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Content Rating is required',
      'Narrative Style is required',
      'Language Complexity is required',
    ]);
  });

  it('rejects values outside the allowed sets', () => {
    const result = validateToneSettings({
      ...DEFAULT_TONE_SETTINGS,
      contentRating: 'X' as never,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Content Rating must be a valid rating']);
  });

  it('caps custom instructions but leaves them optional', () => {
    expect(validateToneSettings(DEFAULT_TONE_SETTINGS).valid).toBe(true);

    const result = validateToneSettings({
      ...DEFAULT_TONE_SETTINGS,
      customInstructions: 'a'.repeat(501),
    });

    expect(result.errors).toEqual([
      'Custom Instructions must be no more than 500 characters',
    ]);
  });
});
