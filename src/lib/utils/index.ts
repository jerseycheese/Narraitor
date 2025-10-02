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
  sentenceCase,
  safeTrim,
  formatNumber,
  formatPercentage,
  formatCompactNumber
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
  getUserFriendlyError, 
  userFriendlyErrorMessage
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
export { debounce, throttle, useDebounce } from './debounce';
export type { DebouncedFunction } from './debounce';

// Tone settings utilities
export { descriptionsToSelectOptions, createEnumChecker, getEnumValues, isValidEnumValue } from './enumHelpers';
export type { SelectOptionWithDescription } from './enumHelpers';
export { createFormUpdater, createFieldProps } from './formHelpers';
export { validateToneSettings, validateToneSettingsCompatibility } from './toneSettingsValidation';

// Skill-related utilities
export { 
  buildCharacterSkillContext, 
  getCharacterSkillInfo, 
  hasActiveSkills 
} from './characterSkillContextBuilder';
export type { SkillContextOptions } from './characterSkillContextBuilder';

export {
  shouldAcknowledgeSkillUsage,
  extractSkillUsageFromContext,
  extractCustomActionFromContext,
  generateSkillAcknowledgmentTags,
  getSkillAcknowledgmentMood
} from './skillAcknowledgmentHelper';
export type { SkillUsageData, CustomActionData } from './skillAcknowledgmentHelper';

// Object access utilities
export {
  getNestedValue,
  hasNestedProperty,
  getNestedPaths
} from './objectAccess';

// State inspection utilities (development only)
export { StateInspector, stateInspector } from './stateInspector';
export type { 
  StateSnapshot, 
  StateMetadata, 
  PathInfo, 
  WatchCallback, 
  WatchSubscription 
} from './stateInspector';

// Enhanced serialization and debugging utilities
export {
  sanitizeForSerialization,
  formatForDebug,
  getValueTypeInfo
} from './formatters';

// === PERFORMANCE UTILITIES ===

/** 
 * Performance measurement utilities for development debugging
 * Lightweight timing, monitoring, and reporting with zero production impact
 * @see performanceUtils.ts for detailed usage examples
 */
export {
  PerformanceTimer,
  measureTime,
  measureAsync,
  createPerformanceGroup,
  generatePerformanceReport,
  getGlobalPerformanceReport,
  clearGlobalMeasurements,
  formatDuration,
  logPerformanceReport,
  monitorCriticalPath,
  createCriticalPathMonitor,
  createAsyncCriticalPathMonitor,
  trackPerformanceMetrics,
  getBatchMetrics,
  clearBatchMetrics,
  generateBatchReport
} from './performanceUtils';

// === RESPONSE EXTRACTION UTILITIES ===

/** 
 * Response information extraction utilities for developer tools and debugging
 * Extract structured data from AI-generated responses with error handling
 * @see responseExtractor.ts for detailed usage examples
 */
export { ResponseExtractor } from './responseExtractor';

/** 
 * Narrative parsing utilities for AI response content processing
 * Handles JSON code blocks, malformed JSON, and multiple fallback strategies
 * @see narrativeParser.ts for detailed usage examples
 */
export { parseNarrativeContent, parseNarrativeContentWithMetadata } from './narrativeParser';
export type { NarrativeParseResult } from './narrativeParser';

/** Type definitions for performance measurement */
export type {
  PerformanceMeasurement,
  PerformanceReport,
  PerformanceOptions,
  CriticalPathOptions,
  BatchMetrics
} from './performanceUtils';
