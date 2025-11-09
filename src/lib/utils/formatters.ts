/**
 * Formatting utilities for consistent data presentation across the application
 * Provides date, string, and number formatting with locale support
 */

/**
 * Date formatting options interface
 * 
 * Extends the standard Intl.DateTimeFormatOptions for consistent date formatting.
 * 
 * @example
 * ```typescript
 * const options: DateFormatOptions = {
 *   year: 'numeric',
 *   month: 'long',
 *   day: 'numeric',
 *   weekday: 'long'
 * };
 * formatDate(new Date(), options); // "Monday, January 15, 2024"
 * ```
 */
export interface DateFormatOptions {
  /** Year format: '2024' or '24' */
  year?: 'numeric' | '2-digit';
  /** Month format: '1', '01', 'January', 'Jan', or 'J' */
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /** Day format: '1' or '01' */
  day?: 'numeric' | '2-digit';
  /** Weekday format: 'Monday', 'Mon', or 'M' */
  weekday?: 'long' | 'short' | 'narrow';
  /** IANA timezone identifier (e.g., 'America/New_York') */
  timeZone?: string;
}

/**
 * Date and time formatting options interface
 * 
 * Extends DateFormatOptions to include time formatting options.
 * 
 * @example
 * ```typescript
 * const options: DateTimeFormatOptions = {
 *   year: 'numeric',
 *   month: 'short',
 *   day: 'numeric',
 *   hour: '2-digit',
 *   minute: '2-digit',
 *   hour12: false
 * };
 * formatDateTime(new Date(), options); // "Jan 15, 2024, 14:30"
 * ```
 */
export interface DateTimeFormatOptions extends DateFormatOptions {
  /** Hour format: '14' or '2' */
  hour?: 'numeric' | '2-digit';
  /** Minute format: '30' or '05' */
  minute?: 'numeric' | '2-digit';
  /** Second format: '45' or '09' */
  second?: 'numeric' | '2-digit';
  /** Use 12-hour format (AM/PM) instead of 24-hour */
  hour12?: boolean;
}

/**
 * Number formatting options interface
 * 
 * Provides fine-grained control over number formatting behavior.
 * 
 * @example
 * ```typescript
 * const options: NumberFormatOptions = {
 *   minimumFractionDigits: 2,
 *   maximumFractionDigits: 2,
 *   useGrouping: true
 * };
 * // Note: Currently used for type definition, implementation uses simpler approach
 * ```
 */
export interface NumberFormatOptions {
  /** Minimum number of decimal places to show */
  minimumFractionDigits?: number;
  /** Maximum number of decimal places to show */
  maximumFractionDigits?: number;
  /** Whether to use thousands separators (commas, periods) */
  useGrouping?: boolean;
  /** Locale identifier for formatting (e.g., 'en-US', 'de-DE') */
  locale?: string;
}

// === DATE FORMATTING ===

/**
 * Validates and parses a date input, handling both Date objects and strings
 * 
 * @param date - Date object or ISO string to validate
 * @returns Parsed Date object or null if invalid
 * @internal This is a private utility function used by other date formatters
 * 
 * @example
 * ```typescript
 * const validDate = validateAndParseDate('2024-01-15T10:00:00Z');
 * const invalidDate = validateAndParseDate('invalid-date'); // returns null
 * ```
 */
function validateAndParseDate(date: Date | string): Date | null {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return isNaN(targetDate.getTime()) ? null : targetDate;
}

/**
 * Formats a date to show relative time (e.g., "2 hours ago", "yesterday").
 * Falls back to standard date format for dates more than a week away.
 *
 * @param date - Date object or ISO string to format
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const targetDate = validateAndParseDate(date);
    if (!targetDate) return 'Invalid date';

    const now = new Date();
    const diffInMilliseconds = targetDate.getTime() - now.getTime();
    const diffInMinutes = Math.floor(Math.abs(diffInMilliseconds) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const isPast = diffInMilliseconds < 0;

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      const unit = diffInMinutes === 1 ? 'minute' : 'minutes';
      return isPast ? `${diffInMinutes} ${unit} ago` : `in ${diffInMinutes} ${unit}`;
    } else if (diffInHours < 24) {
      const unit = diffInHours === 1 ? 'hour' : 'hours';
      return isPast ? `${diffInHours} ${unit} ago` : `in ${diffInHours} ${unit}`;
    } else if (diffInDays === 1) {
      return isPast ? 'yesterday' : 'tomorrow';
    } else if (diffInDays < 7) {
      const unit = 'days';
      return isPast ? `${diffInDays} ${unit} ago` : `in ${diffInDays} ${unit}`;
    } else {
      // For dates more than a week away, show the actual date
      return targetDate.toLocaleDateString();
    }
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats a date with locale-appropriate formatting
 * 
 * Uses the browser's Intl.DateTimeFormat for consistent, localized date display.
 * Defaults to a readable format (e.g., "Jan 15, 2024") but can be customized.
 * 
 * @param date - Date object or ISO string to format
 * @param options - Formatting options for the date (uses Intl.DateTimeFormat options)
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * import { formatDate } from '@/lib/utils';
 * 
 * // Default format
 * formatDate(new Date('2024-01-15')); // "Jan 15, 2024"
 * 
 * // Custom format
 * formatDate(new Date('2024-01-15'), {
 *   year: 'numeric',
 *   month: 'long',
 *   day: 'numeric',
 *   weekday: 'long'
 * }); // "Monday, January 15, 2024"
 * 
 * // Compact format
 * formatDate(new Date('2024-01-15'), {
 *   year: '2-digit',
 *   month: 'numeric',
 *   day: 'numeric'
 * }); // "1/15/24"
 * ```
 * 
 * @see {@link formatRelativeTime} for relative time formatting
 * @see {@link formatDateTime} for combined date and time formatting
 */
export function formatDate(date: Date | string, options: DateFormatOptions = {}): string {
  try {
    const targetDate = validateAndParseDate(date);
    if (!targetDate) return 'Invalid date';

    const defaultOptions: DateFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return targetDate.toLocaleDateString(undefined, defaultOptions);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats time portion of a date
 * 
 * Extracts and formats only the time component using locale-appropriate formatting.
 * Automatically handles 12/24-hour format based on user's locale preferences.
 * 
 * @param date - Date object or ISO string to format
 * @param includeSeconds - Whether to include seconds in the output (default: false)
 * @returns Formatted time string
 * 
 * @example
 * ```typescript
 * import { formatTime } from '@/lib/utils';
 * 
 * formatTime(new Date('2024-01-15T14:30:45')); // "2:30 PM" (in US locale)
 * formatTime(new Date('2024-01-15T14:30:45'), true); // "2:30:45 PM"
 * formatTime('2024-01-15T14:30:45Z'); // Works with ISO strings
 * formatTime('invalid-date'); // "Invalid time"
 * ```
 * 
 * @see {@link formatDate} for date-only formatting
 * @see {@link formatDateTime} for combined date and time formatting
 */
export function formatTime(date: Date | string, includeSeconds: boolean = false): string {
  try {
    const targetDate = validateAndParseDate(date);
    if (!targetDate) return 'Invalid time';

    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' })
    };

    return targetDate.toLocaleTimeString(undefined, options);
  } catch {
    return 'Invalid time';
  }
}

/**
 * Formats both date and time together
 * 
 * Combines date and time formatting in a single, locale-appropriate string.
 * Perfect for timestamps, event listings, and detailed temporal information.
 * 
 * @param date - Date object or ISO string to format
 * @param options - Formatting options for date and time (extends DateFormatOptions)
 * @returns Formatted date and time string
 * 
 * @example
 * ```typescript
 * import { formatDateTime } from '@/lib/utils';
 * 
 * // Default format
 * formatDateTime(new Date('2024-01-15T14:30:00')); // "Jan 15, 2024, 2:30 PM"
 * 
 * // Custom format
 * formatDateTime(new Date('2024-01-15T14:30:00'), {
 *   year: 'numeric',
 *   month: 'long',
 *   day: 'numeric',
 *   hour: '2-digit',
 *   minute: '2-digit',
 *   second: '2-digit',
 *   hour12: false
 * }); // "January 15, 2024, 14:30:00"
 * 
 * // With timezone
 * formatDateTime(new Date('2024-01-15T14:30:00'), {
 *   timeZone: 'America/New_York'
 * }); // Formats in Eastern timezone
 * ```
 * 
 * @see {@link formatDate} for date-only formatting
 * @see {@link formatTime} for time-only formatting
 * @see {@link formatRelativeTime} for relative time formatting
 */
export function formatDateTime(date: Date | string, options: DateTimeFormatOptions = {}): string {
  try {
    const targetDate = validateAndParseDate(date);
    if (!targetDate) return 'Invalid date';

    const defaultOptions: DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...options
    };

    return targetDate.toLocaleString(undefined, defaultOptions);
  } catch {
    return 'Invalid date';
  }
}

// === NUMBER FORMATTING ===

/**
 * Formats a numeric score to fixed decimal places for display
 *
 * Handles edge cases like NaN, Infinity, and undefined gracefully.
 * Perfect for displaying AI relevance scores, confidence values, or percentages.
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted string with trailing zeros
 *
 * @example
 * ```typescript
 * import { formatNumericScore } from '@/lib/utils';
 *
 * formatNumericScore(0.85672); // "0.857"
 * formatNumericScore(NaN); // "0.000"
 * formatNumericScore(0.5, 2); // "0.50"
 * formatNumericScore(Infinity); // "0.000"
 * ```
 *
 * @see {@link formatStringList} for formatting arrays
 */
export function formatNumericScore(value: number, decimals: number = 3): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : '0.'.padEnd(decimals + 2, '0');
}

// === STRING FORMATTING ===

/**
 * Formats an array of strings into a comma-separated list
 *
 * Provides a safe way to display string arrays with a fallback for empty/undefined arrays.
 * Uses an em dash (—) for empty arrays to clearly indicate "no values".
 *
 * @param values - Array of strings to format
 * @param emptyIndicator - String to show when array is empty (default: '—')
 * @returns Comma-separated string or empty indicator
 *
 * @example
 * ```typescript
 * import { formatStringList } from '@/lib/utils';
 *
 * formatStringList(['mystery', 'ancient']); // "mystery, ancient"
 * formatStringList([]); // "—"
 * formatStringList(undefined); // "—"
 * formatStringList([], 'None'); // "None"
 * formatStringList(['combat', 'stealth', 'magic']); // "combat, stealth, magic"
 * ```
 *
 * @see {@link formatNumericScore} for formatting numbers
 */
export function formatStringList(values: string[] | undefined, emptyIndicator: string = '—'): string {
  if (!values || values.length === 0) return emptyIndicator;
  return values.join(', ');
}

/**
 * Truncates text at a specified length with ellipsis.
 * Prefers word boundaries when possible, falls back to character-level truncation.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length of the text portion (ellipsis is added on top)
 * @param suffix - Suffix to append (defaults to '...')
 * @returns Truncated text with suffix
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  if (maxLength <= 0) return suffix;

  // Try to break at word boundary first
  const words = text.split(' ');
  let result = '';
  
  for (let i = 0; i < words.length; i++) {
    const candidate = i === 0 ? words[i] : result + ' ' + words[i];
    if (candidate.length <= maxLength) {
      result = candidate;
    } else {
      break;
    }
  }
  
  // If we found a good word boundary, use it
  if (result && result.length < text.length) {
    return result + suffix;
  }
  
  // Otherwise, truncate at character boundary
  return text.substring(0, maxLength) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * 
 * Converts the first character to uppercase and the rest to lowercase.
 * Useful for normalizing user input or formatting proper nouns.
 * 
 * @param text - Text to capitalize
 * @returns Text with first letter capitalized
 * 
 * @example
 * ```typescript
 * import { capitalize } from '@/lib/utils';
 * 
 * capitalize('hello'); // "Hello"
 * capitalize('HELLO'); // "Hello"
 * capitalize('hELLo'); // "Hello"
 * capitalize('a'); // "A"
 * capitalize(''); // ""
 * ```
 * 
 * @see {@link titleCase} for capitalizing all words
 * @see {@link sentenceCase} for sentence-style capitalization
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts text to title case (capitalizes first letter of each word)
 * 
 * Transforms text so that each word starts with a capital letter.
 * Perfect for headings, titles, and proper names. Handles multiple spaces gracefully.
 * 
 * @param text - Text to convert
 * @returns Text in title case
 * 
 * @example
 * ```typescript
 * import { titleCase } from '@/lib/utils';
 * 
 * titleCase('hello world'); // "Hello World"
 * titleCase('the quick brown fox'); // "The Quick Brown Fox"
 * titleCase('HELLO WORLD'); // "Hello World"
 * titleCase('hELLo  WoRLD'); // "Hello  World"
 * titleCase(''); // ""
 * ```
 * 
 * @note This is a simple implementation that capitalizes every word.
 * For more sophisticated title casing (excluding articles, prepositions),
 * consider using a specialized library.
 * 
 * @see {@link capitalize} for single word capitalization
 * @see {@link sentenceCase} for sentence-style capitalization
 */
export function titleCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Safely trims whitespace from a string, handling null/undefined values
 * 
 * Provides null-safe string trimming that won't throw errors on undefined/null inputs.
 * Removes leading and trailing whitespace, including spaces, tabs, and newlines.
 * Essential for handling user input or optional string fields.
 * 
 * @param text - Text to trim (can be null or undefined)
 * @returns Trimmed text or empty string if input was null/undefined
 * 
 * @example
 * ```typescript
 * import { safeTrim } from '@/lib/utils';
 * 
 * safeTrim('  hello  '); // "hello"
 * safeTrim('\n\thello\r\n'); // "hello"
 * safeTrim(null); // ""
 * safeTrim(undefined); // ""
 * safeTrim(''); // ""
 * 
 * // Safe to use with optional fields
 * const user = { name: '  John  ', nickname: null };
 * const name = safeTrim(user.name); // "John"
 * const nickname = safeTrim(user.nickname); // ""
 * ```
 * 
 * @see {@link truncate} for text truncation with ellipsis
 */
export function safeTrim(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  return text.trim();
}

/** Checks if a string is empty, null, undefined, or only whitespace */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || text.trim() === '';
}

// =============================================================================
// SERIALIZATION AND DEBUGGING UTILITIES
// =============================================================================

/**
 * Safely serializes objects for JSON storage, handling functions, dates, and circular references.
 * Uses a WeakSet to detect circular references during traversal.
 *
 * @param obj - Object to serialize
 * @param options - Optional configuration (maxDepth, functionHandler)
 * @returns Serializable version of the object
 */
export function sanitizeForSerialization(obj: unknown, options?: {
  /** Maximum depth to traverse (prevents infinite recursion) */
  maxDepth?: number;
  /** Custom handler for functions */
  functionHandler?: (fn: (...args: unknown[]) => unknown) => string;
}): unknown {
  const { maxDepth = 10, functionHandler = () => '[Function]' } = options || {};
  const circularRefs = new WeakSet();
  
  function sanitizeRecursive(value: unknown, depth = 0): unknown {
    // Prevent infinite recursion and stack overflow
    if (depth > maxDepth) {
      return '[Max Depth Exceeded]';
    }
    
    // Handle primitive types and null/undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value === 'function') {
      return functionHandler(value as (...args: unknown[]) => unknown);
    }
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value !== 'object') {
      return value;
    }
    
    // Handle circular references
    if (circularRefs.has(value as object)) {
      return '[Circular Reference]';
    }
    
    circularRefs.add(value as object);
    
    try {
      if (Array.isArray(value)) {
        return value.map(item => sanitizeRecursive(item, depth + 1));
      }
      
      const sanitized: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        sanitized[key] = sanitizeRecursive(val, depth + 1);
      });
      
      return sanitized;
    } finally {
      circularRefs.delete(value as object);
    }
  }
  
  return sanitizeRecursive(obj);
}

/**
 * Formats complex objects for debugging with circular reference handling and string truncation.
 *
 * @param obj - Object to format for debugging
 * @param options - Configuration (compact, indent, maxStringLength)
 * @returns Debug-friendly string representation
 */
export function formatForDebug(obj: unknown, options?: {
  /** Compact single-line format */
  compact?: boolean;
  /** Indentation spaces for pretty printing */
  indent?: number;
  /** Maximum string length before truncation */
  maxStringLength?: number;
}): string {
  const { compact = false, indent = 2, maxStringLength = 100 } = options || {};
  
  try {
    // First sanitize the object to handle circular references and special types
    const sanitized = sanitizeForSerialization(obj, {
      functionHandler: (fn) => `[Function: ${fn.name || 'anonymous'}]`
    });
    
    // Apply string length limits for readability
    const limitStrings = (value: unknown): unknown => {
      if (typeof value === 'string' && value.length > maxStringLength) {
        return `${value.substring(0, maxStringLength)}...`;
      }
      if (Array.isArray(value)) {
        return value.map(limitStrings);
      }
      if (value && typeof value === 'object') {
        const limited: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
          limited[key] = limitStrings(val);
        });
        return limited;
      }
      return value;
    };
    
    const processed = limitStrings(sanitized);
    
    if (compact) {
      return JSON.stringify(processed);
    } else {
      return JSON.stringify(processed, null, indent);
    }
  } catch (error) {
    return `[Debug Format Error: ${getErrorMessage(error, 'Unknown error')}]`;
  }
}

// === ARRAY UTILITIES ===

/**
 * Type guard filter that removes null/undefined values from arrays
 *
 * Common pattern for filtering out falsy values while maintaining type safety.
 * Use with array.filter() to narrow array types and remove null/undefined.
 *
 * @param item - Item to check
 * @returns True if item is truthy (non-null, non-undefined)
 *
 * @example
 * ```typescript
 * import { filterTruthy } from '@/lib/utils';
 *
 * const items = [1, null, 2, undefined, 3];
 * const valid = items.filter(filterTruthy); // [1, 2, 3] with type number[]
 *
 * const mixed: (string | null)[] = ['a', null, 'b'];
 * const strings = mixed.filter(filterTruthy); // ['a', 'b'] with type string[]
 * ```
 */
export function filterTruthy<T>(item: T): item is NonNullable<T> {
  return Boolean(item);
}

/** Sort objects by date field, newest first */
export function sortByDateDesc<T extends Record<string, any>>(dateField: keyof T) {
  return (a: T, b: T) => {
    const dateA = new Date(a[dateField]).getTime();
    const dateB = new Date(b[dateField]).getTime();
    return dateB - dateA;
  };
}

/** Sort objects by date field, oldest first */
export function sortByDateAsc<T extends Record<string, any>>(dateField: keyof T) {
  return (a: T, b: T) => {
    const dateA = new Date(a[dateField]).getTime();
    const dateB = new Date(b[dateField]).getTime();
    return dateA - dateB;
  };
}

