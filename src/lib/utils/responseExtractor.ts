// src/lib/utils/responseExtractor.ts

import type { 
  ExtractionResult, 
  ExtractionMetadata, 
  ExtractionConfig,
  ExtractionPattern 
} from '../../types/response-extraction.types';

/**
 * Extract relevant information from AI responses
 * Provides utilities for parsing JSON, key-value pairs, and lists from AI-generated text
 */
export class ResponseExtractor {
  private patterns: ExtractionPattern[] = [];

  constructor(config?: ExtractionConfig) {
    this.patterns = config?.patterns || [];
  }

  /**
   * Extract JSON from response text
   * Looks for ```json code blocks and parses the content
   */
  extractJSON<T = unknown>(response: string): ExtractionResult<T | null> {
    const startTime = performance.now();
    const errors: string[] = [];

    if (!response || typeof response !== 'string') {
      return this.createResult(null, 0, ['Response is empty or invalid'], 'json-block', startTime, response);
    }

    // Look for JSON code block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      return this.createResult(null, 0, ['No JSON block found'], 'json-block', startTime, response);
    }

    try {
      const jsonText = jsonMatch[1].trim();
      const data = JSON.parse(jsonText) as T;
      return this.createResult(data, 0.9, [], 'json-block', startTime, response);
    } catch {
      errors.push('Invalid JSON format');
      return this.createResult(null, 0, errors, 'json-block', startTime, response);
    }
  }

  /**
   * Extract key-value pairs from response text
   * Supports formats like "key: value" on separate lines
   */
  extractKeyValuePairs(response: string, separator: string = ':'): ExtractionResult<Record<string, string>> {
    const startTime = performance.now();
    const data: Record<string, string> = {};

    if (!response || typeof response !== 'string') {
      return this.createResult({}, 0, ['Response is empty or invalid'], 'key-value', startTime, response);
    }

    const lines = response.split('\n');
    let extractedCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const separatorIndex = trimmedLine.indexOf(separator);
      if (separatorIndex === -1) continue;

      const key = trimmedLine.substring(0, separatorIndex).trim();
      const value = trimmedLine.substring(separatorIndex + 1).trim();

      if (key && value) {
        data[key] = value;
        extractedCount++;
      }
    }

    const confidence = extractedCount > 0 ? Math.min(0.8, extractedCount * 0.2) : 0;
    return this.createResult(data, confidence, [], 'key-value', startTime, response);
  }

  /**
   * Extract list items from response text
   * Supports bulleted lists (- item) and numbered lists (1. item)
   */
  extractList(response: string, pattern?: RegExp): ExtractionResult<string[]> {
    const startTime = performance.now();
    const items: string[] = [];

    if (!response || typeof response !== 'string') {
      return this.createResult([], 0, ['Response is empty or invalid'], 'list', startTime, response);
    }

    // Default patterns for common list formats
    const defaultPattern = pattern || /^(?:[-*•]\s+|\d+\.\s+)(.+)$/gm;
    
    let match;
    while ((match = defaultPattern.exec(response)) !== null) {
      const item = match[1]?.trim();
      if (item) {
        items.push(item);
      }
    }

    const confidence = items.length > 0 ? Math.min(0.8, items.length * 0.1) : 0;
    return this.createResult(items, confidence, [], 'list', startTime, response);
  }

  /**
   * Configure custom extraction patterns
   */
  configure(patterns: ExtractionPattern[]): void {
    this.patterns = patterns;
  }

  /**
   * Create a standardized extraction result
   */
  private createResult<T>(
    data: T,
    confidence: number,
    errors: string[],
    patternUsed: string,
    startTime: number,
    input: string
  ): ExtractionResult<T> {
    const processingTime = performance.now() - startTime;
    
    const metadata: ExtractionMetadata = {
      patternUsed,
      confidence,
      processingTime,
      inputLength: input?.length || 0
    };

    return {
      data,
      confidence,
      errors,
      metadata
    };
  }
}