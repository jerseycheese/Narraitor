/**
 * Data sanitization utilities
 * Provides functions to clean and normalize data before validation/storage
 */

import { Sanitizer, FieldSanitization } from './types';

/**
 * Core sanitizer functions
 */
export const sanitizers = {
  /**
   * Trim whitespace from strings
   */
  trim: (): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.trim();
  },

  /**
   * Convert to lowercase
   */
  toLowerCase: (): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase();
  },

  /**
   * Convert to uppercase
   */
  toUpperCase: (): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.toUpperCase();
  },

  /**
   * Normalize whitespace (collapse multiple spaces/newlines)
   */
  normalizeWhitespace: (): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/\s+/g, ' ').trim();
  },

  /**
   * Remove HTML tags from string
   */
  stripHtml: (): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '');
  },

  /**
   * Remove special characters (keep only alphanumeric, spaces, hyphens, underscores)
   */
  removeSpecialChars: (): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
  },

  /**
   * Limit string length
   */
  limitLength: (maxLength: number): Sanitizer<string> => (value) => {
    if (typeof value !== 'string') return value;
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  },

  /**
   * Clamp numeric values between min and max
   */
  clamp: (min: number, max: number): Sanitizer<number> => (value) => {
    if (typeof value !== 'number') return value;
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Round numbers to specified decimal places
   */
  round: (decimals: number = 0): Sanitizer<number> => (value) => {
    if (typeof value !== 'number') return value;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  /**
   * Ensure integer values
   */
  toInteger: (): Sanitizer<number> => (value) => {
    if (typeof value !== 'number') return value;
    return Math.floor(value);
  },

  /**
   * Ensure positive numbers
   */
  ensurePositive: (): Sanitizer<number> => (value) => {
    if (typeof value !== 'number') return value;
    return Math.max(0, value);
  },

  /**
   * Convert empty strings to null
   */
  emptyToNull: <T>(): Sanitizer<T | null> => (value) => {
    if (value === '' || value === undefined) return null;
    return value;
  },

  /**
   * Convert null/undefined to empty string
   */
  nullToEmpty: (): Sanitizer<string> => (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  },

  /**
   * Remove duplicates from arrays
   */
  removeDuplicates: <T>(): Sanitizer<T[]> => (value) => {
    if (!Array.isArray(value)) return value;
    return [...new Set(value)];
  },

  /**
   * Filter out null/undefined values from arrays
   */
  filterNulls: <T>(): Sanitizer<Array<T | null | undefined>> => (value) => {
    if (!Array.isArray(value)) return value;
    return value.filter((item): item is T => item != null);
  },

  /**
   * Sort array values
   */
  sort: <T>(compareFn?: (a: T, b: T) => number): Sanitizer<T[]> => (value) => {
    if (!Array.isArray(value)) return value;
    return [...value].sort(compareFn);
  },

  /**
   * Chain multiple sanitizers
   */
  chain: <T>(...sanitizers: Array<Sanitizer<T>>): Sanitizer<T> => (value) => {
    return sanitizers.reduce((currentValue, sanitizer) => sanitizer(currentValue), value);
  },

  /**
   * Conditional sanitizer - only applies if condition is met
   */
  conditional: <T>(
    condition: (value: T) => boolean,
    sanitizer: Sanitizer<T>
  ): Sanitizer<T> => (value) => {
    if (condition(value)) {
      return sanitizer(value);
    }
    return value;
  },

  /**
   * Custom sanitizer function
   */
  custom: <T>(sanitizerFn: (value: T) => T): Sanitizer<T> => sanitizerFn
};

/**
 * Apply sanitization to multiple fields
 */
export function sanitizeFields<T extends Record<string, unknown>>(
  data: T,
  sanitizations: Array<FieldSanitization<unknown>>
): T {
  // Simplified implementation following KISS principle
  const sanitized = { ...data } as Record<string, unknown>;

  for (const { name, sanitizer } of sanitizations) {
    if (name in sanitized) {
      sanitized[name] = sanitizer(sanitized[name]);
    }
  }

  return sanitized as T;
}

/**
 * Create a sanitization pipeline for objects
 */
export class SanitizationPipeline<T extends Record<string, unknown>> {
  private sanitizations: Array<FieldSanitization<unknown>> = [];

  /**
   * Add field sanitization
   */
  addField<K extends keyof T>(
    fieldName: K,
    sanitizer: Sanitizer<T[K]>
  ): this {
    this.sanitizations.push({
      name: fieldName as string,
      sanitizer: sanitizer as Sanitizer<unknown>
    });
    return this;
  }

  /**
   * Add sanitization for multiple fields with the same sanitizer
   */
  addFields<K extends keyof T>(
    fieldNames: K[],
    sanitizer: Sanitizer<T[K]>
  ): this {
    fieldNames.forEach(fieldName => {
      this.addField(fieldName, sanitizer);
    });
    return this;
  }

  /**
   * Execute the sanitization pipeline
   */
  sanitize(data: T): T {
    return sanitizeFields(data, this.sanitizations);
  }
}

/**
 * Create a sanitization pipeline
 */
export function createSanitizationPipeline<T extends Record<string, unknown>>(): SanitizationPipeline<T> {
  return new SanitizationPipeline<T>();
}

/**
 * Domain-specific sanitizers
 */
export const domainSanitizers = {
  /**
   * Sanitize character data
   */
  character: createSanitizationPipeline<{
    name: string;
    description: string;
    history: string;
    personality: string;
    motivation: string;
  }>()
    .addField('name', sanitizers.chain(
      sanitizers.trim(),
      sanitizers.limitLength(50),
      sanitizers.removeSpecialChars()
    ))
    .addFields(['description', 'history', 'personality', 'motivation'], sanitizers.chain(
      sanitizers.trim(),
      sanitizers.normalizeWhitespace(),
      sanitizers.stripHtml()
    )),

  /**
   * Sanitize world attribute data
   */
  worldAttribute: createSanitizationPipeline<{
    name: string;
    description: string;
    minValue: number;
    maxValue: number;
  }>()
    .addField('name', sanitizers.chain(
      sanitizers.trim(),
      sanitizers.removeSpecialChars()
    ))
    .addField('description', sanitizers.chain(
      sanitizers.trim(),
      sanitizers.normalizeWhitespace(),
      sanitizers.stripHtml()
    ))
    .addFields(['minValue', 'maxValue'], sanitizers.chain(
      sanitizers.toInteger(),
      sanitizers.clamp(-999, 999)
    )),

  /**
   * Sanitize world skill data
   */
  worldSkill: createSanitizationPipeline<{
    name: string;
    description: string;
    difficulty: number;
  }>()
    .addField('name', sanitizers.chain(
      sanitizers.trim(),
      sanitizers.removeSpecialChars()
    ))
    .addField('description', sanitizers.chain(
      sanitizers.trim(),
      sanitizers.normalizeWhitespace(),
      sanitizers.stripHtml()
    ))
    .addField('difficulty', sanitizers.chain(
      sanitizers.toInteger(),
      sanitizers.clamp(1, 10)
    ))
};