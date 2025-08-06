// src/types/response-extraction.types.ts

/**
 * Configuration for response extraction patterns
 */
export interface ExtractionPattern {
  name: string;
  regex: RegExp;
  transform?: (match: RegExpMatchArray) => unknown;
}

/**
 * Metadata about the extraction process
 */
export interface ExtractionMetadata {
  patternUsed: string;
  confidence: number;
  processingTime: number;
  inputLength: number;
}

/**
 * Result of an extraction operation
 */
export interface ExtractionResult<T = unknown> {
  data: T | null;
  confidence: number;
  errors: string[];
  metadata: ExtractionMetadata;
}

/**
 * Basic extraction configuration
 */
export interface ExtractionConfig {
  patterns?: ExtractionPattern[];
  fallbackEnabled?: boolean;
  debugMode?: boolean;
}