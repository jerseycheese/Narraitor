import { ToneSettings } from '@/types/tone-settings.types';
import { validateFields, createValidationRules } from './wizardValidation';
import type { ValidationResult } from './validationUtils';

const CONTENT_RATINGS: string[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
const NARRATIVE_STYLES: string[] = [
  'serious',
  'humorous',
  'dramatic',
  'lighthearted',
  'mysterious',
  'action-packed',
  'contemplative',
  'epic',
  'balanced',
];
const LANGUAGE_COMPLEXITIES: string[] = ['simple', 'moderate', 'advanced', 'literary'];

const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 500;

const validateToneFields = validateFields<Partial<ToneSettings>>({
  contentRating: [
    createValidationRules.required('Content Rating is required'),
    createValidationRules.custom(
      (value) => CONTENT_RATINGS.includes(value ?? ''),
      'Content Rating must be a valid rating'
    ),
  ],
  narrativeStyle: [
    createValidationRules.required('Narrative Style is required'),
    createValidationRules.custom(
      (value) => NARRATIVE_STYLES.includes(value ?? ''),
      'Narrative Style must be a valid style'
    ),
  ],
  languageComplexity: [
    createValidationRules.required('Language Complexity is required'),
    createValidationRules.custom(
      (value) => LANGUAGE_COMPLEXITIES.includes(value ?? ''),
      'Language Complexity must be a valid level'
    ),
  ],
  customInstructions: [
    createValidationRules.maxLength(
      MAX_CUSTOM_INSTRUCTIONS_LENGTH,
      `Custom Instructions must be no more than ${MAX_CUSTOM_INSTRUCTIONS_LENGTH} characters`
    ),
  ],
});

/**
 * Validates tone settings configuration
 */
export function validateToneSettings(
  toneSettings: Partial<ToneSettings>
): ValidationResult {
  const { valid, errors } = validateToneFields(toneSettings);
  return { valid, errors };
}
