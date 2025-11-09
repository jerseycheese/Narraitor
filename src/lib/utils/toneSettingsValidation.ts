import { ToneSettings } from '@/types/tone-settings.types';
import { validators, validateField } from '@/components/shared/wizard/utils/validation';
import { ValidationResult } from '@/lib/utils/validationUtils';

/**
 * Validates tone settings configuration
 */
export function validateToneSettings(toneSettings: Partial<ToneSettings>): ValidationResult {
  const errors: string[] = [];

  // Validate content rating
  const contentRatingError = validateField(toneSettings.contentRating, [
    (value) => validators.required(value, 'Content Rating'),
    (value) => validators.custom(
      value,
      (v) => ['G', 'PG', 'PG-13', 'R', 'NC-17'].includes(v as string),
      'Content Rating must be a valid rating'
    )
  ]);
  if (contentRatingError) errors.push(contentRatingError);

  // Validate narrative style
  const narrativeStyleError = validateField(toneSettings.narrativeStyle, [
    (value) => validators.required(value, 'Narrative Style'),
    (value) => validators.custom(
      value,
      (v) => ['serious', 'humorous', 'dramatic', 'lighthearted', 'mysterious', 'action-packed', 'contemplative', 'epic', 'balanced'].includes(v as string),
      'Narrative Style must be a valid style'
    )
  ]);
  if (narrativeStyleError) errors.push(narrativeStyleError);

  // Validate language complexity
  const languageComplexityError = validateField(toneSettings.languageComplexity, [
    (value) => validators.required(value, 'Language Complexity'),
    (value) => validators.custom(
      value,
      (v) => ['simple', 'moderate', 'advanced', 'literary'].includes(v as string),
      'Language Complexity must be a valid level'
    )
  ]);
  if (languageComplexityError) errors.push(languageComplexityError);

  // Validate custom instructions (optional but limited length)
  if (toneSettings.customInstructions) {
    const customInstructionsError = validateField(toneSettings.customInstructions, [
      (value) => validators.maxLength(value as string, 500, 'Custom Instructions')
    ]);
    if (customInstructionsError) errors.push(customInstructionsError);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}