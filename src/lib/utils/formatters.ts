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

// === STRING FORMATTING ===

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
 * Converts text to sentence case (capitalizes first letter of each sentence)
 * 
 * Capitalizes the first letter of each sentence, identified by sentence-ending
 * punctuation (periods, exclamation marks, question marks) followed by whitespace.
 * Great for normalizing user-generated content or AI-generated text.
 * 
 * @param text - Text to convert
 * @returns Text in sentence case
 * 
 * @example
 * ```typescript
 * import { sentenceCase } from '@/lib/utils';
 * 
 * sentenceCase('hello world. this is great.');
 * // "Hello world. This is great."
 * 
 * sentenceCase('hello! how are you? fine thanks.');
 * // "Hello! How are you? Fine thanks."
 * 
 * sentenceCase('HELLO WORLD');
 * // "Hello world"
 * 
 * sentenceCase('');
 * // ""
 * ```
 * 
 * @see {@link capitalize} for single word capitalization
 * @see {@link titleCase} for title-style capitalization
 */
export function sentenceCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/(^|\.\s+|\!\s+|\?\s+)(\w)/g, (match, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    });
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

// === NUMBER FORMATTING ===

/**
 * Formats numbers with locale-appropriate separators and decimal places
 * 
 * Uses the browser's Intl.NumberFormat for consistent, localized number display.
 * Automatically handles thousands separators (commas in US, periods in EU) and
 * decimal formatting based on user's locale preferences.
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (optional, uses natural precision if not specified)
 * @returns Formatted number string
 * 
 * @example
 * ```typescript
 * import { formatNumber } from '@/lib/utils';
 * 
 * formatNumber(1234567.89); // "1,234,567.89" (US) or "1.234.567,89" (EU)
 * formatNumber(1234567.89, 2); // "1,234,567.89"
 * formatNumber(1234567.89, 0); // "1,234,568"
 * formatNumber(42); // "42"
 * formatNumber(0); // "0"
 * formatNumber(-1234); // "-1,234"
 * 
 * // Error handling
 * formatNumber(Infinity); // "Invalid number"
 * formatNumber(NaN); // "Invalid number"
 * ```
 * 
 * @performance Uses native Intl.NumberFormat for optimal performance
 * @see {@link formatPercentage} for percentage formatting
 * @see {@link formatCompactNumber} for compact number notation
 */
export function formatNumber(value: number, decimals?: number): string {
  try {
    // Handle edge cases for invalid numbers
    if (!Number.isFinite(value)) {
      return 'Invalid number';
    }
    
    const options: Intl.NumberFormatOptions = {
      useGrouping: true,
      ...(decimals !== undefined && {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    };

    return value.toLocaleString(undefined, options);
  } catch {
    return value.toString();
  }
}

/**
 * Formats a decimal value as a percentage
 * 
 * Converts decimal values to percentage format with intelligent precision.
 * When decimals aren't specified, automatically removes trailing zeros for clean display.
 * Perfect for displaying completion rates, progress indicators, and statistical data.
 * 
 * @param value - Decimal value to format (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (defaults to intelligent formatting)
 * @returns Formatted percentage string
 * 
 * @example
 * ```typescript
 * import { formatPercentage } from '@/lib/utils';
 * 
 * formatPercentage(0.75); // "75%"
 * formatPercentage(0.1234); // "12.34%"
 * formatPercentage(0.1234, 1); // "12.3%"
 * formatPercentage(0.1234, 0); // "12%"
 * formatPercentage(1.5); // "150%"
 * formatPercentage(0); // "0%"
 * 
 * // Intelligent formatting removes trailing zeros
 * formatPercentage(0.75); // "75%" (not "75.00%")
 * formatPercentage(0.7500); // "75%" (not "75.00%")
 * 
 * // Error handling
 * formatPercentage(Infinity); // "Invalid percentage"
 * formatPercentage(NaN); // "Invalid percentage"
 * ```
 * 
 * @see {@link formatNumber} for general number formatting
 * @see {@link formatCompactNumber} for large number formatting
 */
export function formatPercentage(value: number, decimals?: number): string {
  try {
    // Handle edge cases for invalid numbers
    if (!Number.isFinite(value)) {
      return 'Invalid percentage';
    }
    
    const percentage = value * 100;
    
    // If decimals not specified, use intelligent formatting
    if (decimals === undefined) {
      // Remove trailing zeros for clean display
      const formatted = percentage.toFixed(2);
      return `${parseFloat(formatted)}%`;
    }
    
    return `${percentage.toFixed(decimals)}%`;
  } catch {
    return `${value}%`;
  }
}

/**
 * Formats large numbers in compact notation (e.g., 1.2K, 1.2M, 1.2B)
 * 
 * Converts large numbers to human-readable compact format using K (thousands),
 * M (millions), and B (billions) suffixes. Automatically removes trailing zeros
 * for clean display. Perfect for social media counters, file sizes, and statistics.
 * 
 * @param value - Number to format
 * @returns Compact formatted number string
 * 
 * @example
 * ```typescript
 * import { formatCompactNumber } from '@/lib/utils';
 * 
 * formatCompactNumber(999); // "999"
 * formatCompactNumber(1000); // "1K"
 * formatCompactNumber(1200); // "1.2K"
 * formatCompactNumber(1234567); // "1.2M"
 * formatCompactNumber(1234567890); // "1.2B"
 * formatCompactNumber(-1234); // "-1.2K"
 * 
 * // Clean formatting removes unnecessary decimals
 * formatCompactNumber(1000); // "1K" (not "1.0K")
 * formatCompactNumber(1500); // "1.5K"
 * 
 * // Error handling
 * formatCompactNumber(Infinity); // "Invalid number"
 * formatCompactNumber(NaN); // "Invalid number"
 * ```
 * 
 * @note Currently supports up to billions. For larger numbers, falls back to standard notation.
 * @see {@link formatNumber} for detailed number formatting
 * @see {@link formatPercentage} for percentage formatting
 */
export function formatCompactNumber(value: number): string {
  try {
    // Handle edge cases for invalid numbers
    if (!Number.isFinite(value)) {
      return 'Invalid number';
    }
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue < 1000) {
      return value.toString();
    } else if (absValue < 1000000) {
      const thousands = absValue / 1000;
      return `${sign}${thousands.toFixed(1)}K`.replace('.0K', 'K');
    } else if (absValue < 1000000000) {
      const millions = absValue / 1000000;
      return `${sign}${millions.toFixed(1)}M`.replace('.0M', 'M');
    } else {
      const billions = absValue / 1000000000;
      return `${sign}${billions.toFixed(1)}B`.replace('.0B', 'B');
    }
  } catch {
    return value.toString();
  }
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
    return `[Debug Format Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

