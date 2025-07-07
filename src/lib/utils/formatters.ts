/**
 * Formatting utilities for consistent data presentation across the application
 * Provides date, string, and number formatting with locale support
 */

/**
 * Date formatting options interface
 */
export interface DateFormatOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  weekday?: 'long' | 'short' | 'narrow';
  timeZone?: string;
}

/**
 * Date and time formatting options interface
 */
export interface DateTimeFormatOptions extends DateFormatOptions {
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
}

/**
 * Number formatting options interface
 */
export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  locale?: string;
}

// === DATE FORMATTING ===

/**
 * Validates and parses a date input, handling both Date objects and strings
 * @param date - Date object or ISO string to validate
 * @returns Parsed Date object or null if invalid
 */
function validateAndParseDate(date: Date | string): Date | null {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return isNaN(targetDate.getTime()) ? null : targetDate;
}

/**
 * Formats a date to show relative time (e.g., "2 hours ago", "yesterday")
 * Extends the existing formatDistanceToNow function with better future handling
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
 * @param date - Date object or ISO string to format
 * @param options - Formatting options for the date
 * @returns Formatted date string
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
 * @param date - Date object or ISO string to format
 * @param includeSeconds - Whether to include seconds in the output
 * @returns Formatted time string
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
 * @param date - Date object or ISO string to format
 * @param options - Formatting options for date and time
 * @returns Formatted date and time string
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
 * Truncates text at a specified length with ellipsis
 * Tries to break at word boundaries when possible
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
 * @param text - Text to capitalize
 * @returns Text with first letter capitalized
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts text to title case (capitalizes first letter of each word)
 * @param text - Text to convert
 * @returns Text in title case
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
 * @param text - Text to convert
 * @returns Text in sentence case
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
 * @param text - Text to trim (can be null or undefined)
 * @returns Trimmed text or empty string if input was null/undefined
 */
export function safeTrim(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  return text.trim();
}

// === NUMBER FORMATTING ===

/**
 * Formats numbers with locale-appropriate separators and decimal places
 * @param value - Number to format
 * @param decimals - Number of decimal places (optional)
 * @returns Formatted number string
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
 * @param value - Decimal value to format (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (defaults to intelligent formatting)
 * @returns Formatted percentage string
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
 * @param value - Number to format
 * @returns Compact formatted number string
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