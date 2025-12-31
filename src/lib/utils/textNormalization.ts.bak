/**
 * Simplified text normalization utilities for consistent text formatting
 * Provides essential text processing for user input and AI-generated content
 */

/**
 * Configuration options for text normalization
 */
export interface TextNormalizationOptions {
  /** Normalize whitespace (spaces, tabs, excessive spacing) */
  normalizeWhitespace?: boolean;
  /** Standardize line endings to Unix format (\n) */
  normalizeLineEndings?: boolean;
  /** Normalize quotation marks to straight quotes */
  normalizeQuotes?: boolean;
  /** Normalize special characters (smart quotes, dashes, etc.) */
  normalizeSpecialChars?: boolean;
  /** Preserve semantic structure (paragraph breaks, intentional formatting) */
  preserveStructure?: boolean;
}

// Common normalization presets used throughout stores
export const NORM_NAME = {
  normalizeWhitespace: true,
  normalizeQuotes: true,
  normalizeSpecialChars: true,
  preserveStructure: false
};

export const NORM_DESC = {
  normalizeWhitespace: true,
  normalizeLineEndings: true,
  normalizeQuotes: true,
  normalizeSpecialChars: true,
  preserveStructure: true
};

/**
 * Main text normalization function
 *
 * @param text - Text to normalize
 * @param options - Normalization options (all features enabled by default)
 * @returns Normalized text string
 */
export function normalizeText(text: string, options: TextNormalizationOptions = {}): string {
  if (!text || typeof text !== 'string') return '';

  const defaultOptions: Required<TextNormalizationOptions> = {
    normalizeWhitespace: true,
    normalizeLineEndings: true,
    normalizeQuotes: true,
    normalizeSpecialChars: true,
    preserveStructure: true,
    ...options
  };

  let normalized = text;

  // Apply normalizations in order
  if (defaultOptions.normalizeLineEndings) {
    normalized = normalizeLineEndings(normalized);
  }

  if (defaultOptions.normalizeWhitespace) {
    normalized = normalizeWhitespace(normalized, defaultOptions.preserveStructure);
  }

  if (defaultOptions.normalizeQuotes) {
    normalized = normalizeQuotationMarks(normalized);
  }

  if (defaultOptions.normalizeSpecialChars) {
    normalized = normalizeSpecialCharacters(normalized);
  }

  return normalized;
}

/**
 * Normalizes whitespace while preserving semantic structure
 */
export function normalizeWhitespace(text: string, preserveStructure: boolean = true): string {
  if (!text) return '';

  let normalized = text;

  // Convert tabs to spaces
  normalized = normalized.replace(/\t/g, ' ');

  // Replace multiple spaces with single space
  normalized = normalized.replace(/[ ]+/g, ' ');

  // Trim each line
  normalized = normalized.split('\n').map(line => line.trim()).join('\n');

  // Handle paragraph structure
  if (preserveStructure) {
    // Normalize multiple line breaks to double (paragraph breaks)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
  } else {
    // Remove all excess line breaks
    normalized = normalized.replace(/\n+/g, ' ');
  }

  return normalized.trim();
}

/**
 * Standardizes line endings to Unix format (\n)
 */
export function normalizeLineEndings(text: string): string {
  if (!text) return '';
  return text.replace(/\r\n?/g, '\n');
}

/**
 * Normalizes quotation marks to straight quotes
 */
export function normalizeQuotationMarks(text: string): string {
  if (!text) return '';

  return text
    .replace(/[\u201c\u201d]/g, '"')  // Smart double quotes → straight double quotes
    .replace(/[\u2018\u2019]/g, "'"); // Smart single quotes → straight single quotes
}

/**
 * Normalizes special characters to ASCII equivalents
 */
export function normalizeSpecialCharacters(text: string): string {
  if (!text) return '';

  return text
    .replace(/—/g, '-')   // Em dash → hyphen
    .replace(/–/g, '-')   // En dash → hyphen
    .replace(/…/g, '...'); // Ellipsis → three periods
}
