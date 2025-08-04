/**
 * Text normalization utilities for consistent text formatting across the application
 * Provides standardized text processing for debugging, developer tools, and content normalization
 */

/**
 * Configuration options for text normalization
 * Controls which normalization features are applied to the input text
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

/**
 * Details about changes made during normalization
 */
export interface NormalizationChange {
  /** Type of change applied */
  type: 'whitespace' | 'lineEndings' | 'quotes' | 'specialChars' | 'structure';
  /** Description of the change */
  description: string;
  /** Number of occurrences changed */
  count: number;
}

/**
 * Statistics about the normalization process
 */
export interface NormalizationStats {
  /** Original text length */
  originalLength: number;
  /** Normalized text length */
  normalizedLength: number;
  /** Total number of changes made */
  totalChanges: number;
  /** Time taken for normalization in milliseconds */
  processingTime: number;
}

/**
 * Detailed result of text normalization including changes and statistics
 */
export interface NormalizationResult {
  /** The normalized text */
  normalized: string;
  /** List of changes made during normalization */
  changes: NormalizationChange[];
  /** Processing statistics */
  stats: NormalizationStats;
}

/**
 * Text analysis information for debugging and insights
 */
export interface TextAnalysis {
  /** Character count */
  characters: number;
  /** Line count */
  lines: number;
  /** Paragraph count (double line breaks) */
  paragraphs: number;
  /** Word count (approximate) */
  words: number;
  /** Detected line ending format */
  lineEndingFormat: 'unix' | 'windows' | 'mac' | 'mixed';
  /** Contains special characters */
  hasSpecialChars: boolean;
  /** Contains smart quotes */
  hasSmartQuotes: boolean;
}

/**
 * Whitespace analysis for debugging text processing issues
 */
export interface WhitespaceStats {
  /** Leading whitespace characters */
  leading: number;
  /** Trailing whitespace characters */
  trailing: number;
  /** Internal excessive spaces (more than single space) */
  excessiveSpaces: number;
  /** Tab characters */
  tabs: number;
  /** Multiple consecutive line breaks */
  multipleLineBreaks: number;
}

/**
 * Main text normalization function with basic options
 * 
 * Applies text normalization with commonly used settings for consistent text formatting.
 * Perfect for cleaning up AI-generated content, user input, or text from various sources.
 * 
 * @param text - Text to normalize
 * @param options - Normalization options (all features enabled by default)
 * @returns Normalized text string
 * 
 * @example
 * ```typescript
 * import { normalizeText } from '@/lib/utils';
 * 
 * // Basic normalization with default options
 * const result = normalizeText("Hello   world\r\n\r\nThis  is "quoted" text.");
 * // Returns: "Hello world\n\nThis is \"quoted\" text."
 * 
 * // Selective normalization
 * const result = normalizeText(messyText, {
 *   normalizeWhitespace: true,
 *   normalizeQuotes: true,
 *   normalizeLineEndings: false
 * });
 * ```
 * 
 * @see {@link normalizeTextWithDetails} for detailed analysis and change tracking
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

  // Apply normalizations in order of importance for consistent results
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
 * Text normalization with detailed analysis and change tracking
 * 
 * Provides comprehensive text normalization with detailed information about changes made.
 * Perfect for debugging text processing issues and understanding what transformations occurred.
 * 
 * @param text - Text to normalize
 * @param options - Normalization options
 * @returns Detailed normalization result with changes and statistics
 * 
 * @example
 * ```typescript
 * import { normalizeTextWithDetails } from '@/lib/utils';
 * 
 * const result = normalizeTextWithDetails("Messy   text\r\n\r\nWith "quotes"");
 * console.log(result.normalized); // Cleaned text
 * console.log(result.changes); // List of changes made
 * console.log(result.stats); // Processing statistics
 * ```
 */
export function normalizeTextWithDetails(
  text: string, 
  options: TextNormalizationOptions = {}
): NormalizationResult {
  const startTime = performance.now();
  const originalLength = text?.length || 0;
  const changes: NormalizationChange[] = [];

  if (!text || typeof text !== 'string') {
    return {
      normalized: '',
      changes: [],
      stats: {
        originalLength: 0,
        normalizedLength: 0,
        totalChanges: 0,
        processingTime: 0
      }
    };
  }

  const defaultOptions: Required<TextNormalizationOptions> = {
    normalizeWhitespace: true,
    normalizeLineEndings: true,
    normalizeQuotes: true,
    normalizeSpecialChars: true,
    preserveStructure: true,
    ...options
  };

  let normalized = text;

  // Track line ending changes
  if (defaultOptions.normalizeLineEndings) {
    const before = normalized;
    normalized = normalizeLineEndings(normalized);
    if (before !== normalized) {
      const windowsCount = (before.match(/\r\n/g) || []).length;
      const macCount = (before.match(/\r(?!\n)/g) || []).length;
      const totalCount = windowsCount + macCount;
      
      if (totalCount > 0) {
        changes.push({
          type: 'lineEndings',
          description: `Normalized ${windowsCount} Windows and ${macCount} Mac line endings to Unix format`,
          count: totalCount
        });
      }
    }
  }

  // Track whitespace changes
  if (defaultOptions.normalizeWhitespace) {
    const before = normalized;
    normalized = normalizeWhitespace(normalized, defaultOptions.preserveStructure);
    if (before !== normalized) {
      const excessiveSpaces = (before.match(/[ ]{2,}/g) || []).length;
      const tabs = (before.match(/\t/g) || []).length;
      
      changes.push({
        type: 'whitespace',
        description: `Normalized ${excessiveSpaces} excessive spaces and ${tabs} tabs`,
        count: excessiveSpaces + tabs
      });
    }
  }

  // Track quotation mark changes
  if (defaultOptions.normalizeQuotes) {
    const before = normalized;
    normalized = normalizeQuotationMarks(normalized);
    if (before !== normalized) {
      const smartQuotes = (before.match(/[""'']/g) || []).length;
      
      if (smartQuotes > 0) {
        changes.push({
          type: 'quotes',
          description: `Normalized ${smartQuotes} smart quotes to straight quotes`,
          count: smartQuotes
        });
      }
    }
  }

  // Track special character changes
  if (defaultOptions.normalizeSpecialChars) {
    const before = normalized;
    normalized = normalizeSpecialCharacters(normalized);
    if (before !== normalized) {
      const specialChars = (before.match(/[—–…]/g) || []).length;
      
      if (specialChars > 0) {
        changes.push({
          type: 'specialChars',
          description: `Normalized ${specialChars} special characters`,
          count: specialChars
        });
      }
    }
  }

  const endTime = performance.now();
  const totalChanges = changes.reduce((sum, change) => sum + change.count, 0);

  return {
    normalized,
    changes,
    stats: {
      originalLength,
      normalizedLength: normalized.length,
      totalChanges,
      processingTime: Math.round((endTime - startTime) * 100) / 100
    }
  };
}

/**
 * Normalizes whitespace while preserving semantic structure
 * 
 * Removes excessive spaces, converts tabs to spaces, and trims lines
 * while optionally preserving paragraph breaks and intentional structure.
 * 
 * @param text - Text to normalize
 * @param preserveStructure - Whether to preserve paragraph breaks (default: true)
 * @returns Text with normalized whitespace
 * 
 * @example
 * ```typescript
 * normalizeWhitespace("Hello    world\t\n\n  Next paragraph  ");
 * // Returns: "Hello world\n\nNext paragraph"
 * ```
 */
export function normalizeWhitespace(text: string, preserveStructure: boolean = true): string {
  if (!text) return '';

  let normalized = text;

  // Convert tabs to spaces
  normalized = normalized.replace(/\t/g, ' ');

  // Replace multiple spaces with single space (but preserve newlines)
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

  // Trim the entire string
  return normalized.trim();
}

/**
 * Standardizes line endings to Unix format (\n)
 * 
 * Converts Windows (\r\n) and Mac (\r) line endings to Unix format.
 * Essential for consistent text processing across different platforms.
 * 
 * @param text - Text to normalize
 * @param format - Target line ending format (default: 'unix')
 * @returns Text with standardized line endings
 * 
 * @example
 * ```typescript
 * normalizeLineEndings("Hello\r\nWorld\rNext line");
 * // Returns: "Hello\nWorld\nNext line"
 * ```
 */
export function normalizeLineEndings(text: string, format: 'unix' | 'windows' | 'mac' = 'unix'): string {
  if (!text) return '';

  // First normalize all to Unix format
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Then convert to requested format if not Unix
  switch (format) {
    case 'windows':
      return normalized.replace(/\n/g, '\r\n');
    case 'mac':
      return normalized.replace(/\n/g, '\r');
    case 'unix':
    default:
      return normalized;
  }
}

/**
 * Normalizes quotation marks to straight quotes
 * 
 * Converts smart quotes (curly quotes) to straight ASCII quotes.
 * Preserves apostrophes in contractions but normalizes quotation marks.
 * 
 * @param text - Text containing quotation marks
 * @returns Text with normalized quotes
 * 
 * @example
 * ```typescript
 * normalizeQuotationMarks(""Hello world" and 'goodbye'");
 * // Returns: "\"Hello world\" and 'goodbye'"
 * ```
 */
export function normalizeQuotationMarks(text: string): string {
  if (!text) return '';

  return text
    // Smart double quotes to straight double quotes
    .replace(/[""]/g, '"')
    // Smart single quotes to straight single quotes
    // But be careful with contractions - only replace obvious quotation marks
    .replace(/['']/g, "'");
}

/**
 * Normalizes special characters to ASCII equivalents
 * 
 * Converts common special characters like em dashes, en dashes, and ellipses
 * to their ASCII equivalents for consistent text processing.
 * 
 * @param text - Text containing special characters
 * @returns Text with normalized special characters
 * 
 * @example
 * ```typescript
 * normalizeSpecialCharacters("Hello—world…and more–text");
 * // Returns: "Hello-world...and more-text"
 * ```
 */
export function normalizeSpecialCharacters(text: string): string {
  if (!text) return '';

  return text
    // Em dash to hyphen
    .replace(/—/g, '-')
    // En dash to hyphen  
    .replace(/–/g, '-')
    // Ellipsis to three periods
    .replace(/…/g, '...');
}

/**
 * Analyzes text to provide insights about its structure and formatting
 * 
 * Provides detailed analysis of text characteristics for debugging
 * and understanding text processing requirements.
 * 
 * @param text - Text to analyze
 * @returns Detailed text analysis
 * 
 * @example
 * ```typescript
 * const analysis = analyzeText("Hello\r\nworld\n\nWith "quotes"");
 * console.log(analysis.lineEndingFormat); // "mixed"
 * console.log(analysis.hasSmartQuotes); // true
 * ```
 */
export function analyzeText(text: string): TextAnalysis {
  if (!text) {
    return {
      characters: 0,
      lines: 0,
      paragraphs: 0,
      words: 0,
      lineEndingFormat: 'unix',
      hasSpecialChars: false,
      hasSmartQuotes: false
    };
  }

  const lines = text.split(/\r\n|\r|\n/);
  const paragraphs = text.split(/\r\n\r\n|\r\r|\n\n/).filter(p => p.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);

  // Detect line ending format
  const hasWindows = /\r\n/.test(text);
  const hasMac = /\r(?!\n)/.test(text);
  const hasUnix = /(?<!\r)\n/.test(text);
  
  let lineEndingFormat: 'unix' | 'windows' | 'mac' | 'mixed';
  if ((hasWindows && hasMac) || (hasWindows && hasUnix) || (hasMac && hasUnix)) {
    lineEndingFormat = 'mixed';
  } else if (hasWindows) {
    lineEndingFormat = 'windows';
  } else if (hasMac) {
    lineEndingFormat = 'mac';
  } else {
    lineEndingFormat = 'unix';
  }

  return {
    characters: text.length,
    lines: lines.length,
    paragraphs: paragraphs.length,
    words: words.length,
    lineEndingFormat,
    hasSpecialChars: /[—–…]/.test(text),
    hasSmartQuotes: /[""'']/.test(text)
  };
}

/**
 * Analyzes whitespace in text for debugging purposes
 * 
 * Provides detailed statistics about whitespace usage for identifying
 * text processing issues and optimization opportunities.
 * 
 * @param text - Text to analyze
 * @returns Detailed whitespace statistics
 * 
 * @example
 * ```typescript
 * const stats = getWhitespaceStats("  Hello   world\t\n\n\n");
 * console.log(stats.leading); // 2
 * console.log(stats.excessiveSpaces); // 1
 * console.log(stats.tabs); // 1
 * ```
 */
export function getWhitespaceStats(text: string): WhitespaceStats {
  if (!text) {
    return {
      leading: 0,
      trailing: 0,
      excessiveSpaces: 0,
      tabs: 0,
      multipleLineBreaks: 0
    };
  }

  const leadingMatch = text.match(/^\s*/);
  const trailingMatch = text.match(/\s*$/);
  const excessiveSpacesMatches = text.match(/[ ]{2,}/g) || [];
  const tabMatches = text.match(/\t/g) || [];
  const multipleLineBreakMatches = text.match(/\n{3,}/g) || [];

  return {
    leading: leadingMatch ? leadingMatch[0].length : 0,
    trailing: trailingMatch ? trailingMatch[0].length : 0,
    excessiveSpaces: excessiveSpacesMatches.length,
    tabs: tabMatches.length,
    multipleLineBreaks: multipleLineBreakMatches.length
  };
}