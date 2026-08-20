
/** UUID generation utilities */
export { generateUniqueId } from './generateId';

/** Timestamp generation utilities */
export { getTimestamp } from './timestamp';

/** AI text formatting utilities */
export { formatAIResponse } from './textFormatter';

/** CSS class name utilities */
export { cssClasses } from './classNames';

/**
 * Formatting utilities for dates, strings, and numbers
 * @see README.md for detailed usage examples
 */
export {
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateTime,
  truncate,
  capitalize,
  titleCase,
  safeTrim,
} from './formatters';

/** Text normalization utilities for consistent text formatting */
export { normalizeText, NORM_NAME, NORM_DESC } from './textNormalization';

// Validation utilities
export { type ValidationResult } from './validationUtils';

// Tone settings utilities
export { descriptionsToSelectOptions } from './enumHelpers';
export { validateToneSettings } from './toneSettingsValidation';

// Enhanced serialization and debugging utilities
export { sanitizeForSerialization } from './formatters';

/**
 * Narrative parsing utilities for AI response content processing
 * Handles JSON code blocks, malformed JSON, and multiple fallback strategies
 * @see narrativeParser.ts for detailed usage examples
 */
export { parseNarrativeContent } from './narrativeParser';
