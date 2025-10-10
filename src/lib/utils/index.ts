// === CORE UTILITIES ===

/** UUID generation utilities */
export { generateUniqueId } from './generateId';

/** Timestamp generation utilities */
export { getTimestamp } from './timestamp';

/** AI text formatting utilities */
export { formatAIResponse } from './textFormatter';
export type { FormattingOptions } from './textFormatter';

/** CSS class name utilities */
export { cn } from './classNames';

// === FORMATTING UTILITIES ===

/** 
 * Comprehensive formatting utilities for dates, strings, and numbers
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
  safeTrim
} from './formatters';

/** Type definitions for formatting options */
export type { DateFormatOptions, DateTimeFormatOptions, NumberFormatOptions } from './formatters';

/** Text normalization utilities for developer tools and debugging */
export {
  normalizeText,
  normalizeTextWithDetails,
  normalizeWhitespace,
  normalizeLineEndings,
  normalizeQuotationMarks,
  normalizeSpecialCharacters,
  analyzeText,
  getWhitespaceStats,
  NORM_NAME,
  NORM_DESC
} from './textNormalization';

/** Type definitions for text normalization */
export type {
  TextNormalizationOptions,
  NormalizationResult,
  NormalizationChange,
  NormalizationStats,
  TextAnalysis,
  WhitespaceStats
} from './textNormalization';

// Error handling utilities
export {
  isRetryableError,
  getUserFriendlyError
} from './errorUtils';
export type { UserFriendlyError } from './errorUtils';

// Validation utilities
export {
  validateName,
  validateText,
  validatePointDistribution,
  validateSelectionCount,
  type ValidationResult
} from './validationUtils';

// Debounce utilities
export { debounce } from './debounce';
export type { DebouncedFunction } from './debounce';

// Tone settings utilities
export { descriptionsToSelectOptions } from './enumHelpers';
export type { SelectOptionWithDescription } from './enumHelpers';
export { createFormUpdater } from './formHelpers';
export { validateToneSettings } from './toneSettingsValidation';


// Enhanced serialization and debugging utilities
export {
  sanitizeForSerialization,
  formatForDebug
} from './formatters';


/** 
 * Narrative parsing utilities for AI response content processing
 * Handles JSON code blocks, malformed JSON, and multiple fallback strategies
 * @see narrativeParser.ts for detailed usage examples
 */
export { parseNarrativeContent } from './narrativeParser';

