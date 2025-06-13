import { ToneSettings, ContentRating, NarrativeStyle, LanguageComplexity } from '@/types/tone-settings.types';
import { validators, validateField, ValidationResult } from '@/components/shared/wizard/utils/validation';

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

/**
 * Validates if tone settings are compatible with world theme
 */
export function validateToneSettingsCompatibility(
  toneSettings: ToneSettings,
  worldTheme: string
): ValidationResult {
  const errors: string[] = [];

  // Check for incompatible combinations
  const theme = worldTheme.toLowerCase();
  
  if (theme === 'horror' && toneSettings.contentRating === 'G') {
    errors.push('Horror themes typically require higher content ratings');
  }
  
  if (theme === 'children' && ['R', 'NC-17'].includes(toneSettings.contentRating)) {
    errors.push('Children\'s themes should use family-friendly content ratings');
  }
  
  if (toneSettings.narrativeStyle === 'humorous' && ['horror', 'drama'].includes(theme)) {
    // This is a warning, not an error - allow but note potential mismatch
  }

  return {
    valid: errors.length === 0,
    errors
  };
}