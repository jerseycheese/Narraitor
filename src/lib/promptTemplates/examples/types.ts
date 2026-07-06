/**
 * @fileoverview Types and interfaces for the example library system
 *
 * This module defines the structure for prompt examples that guide AI responses.
 * Examples can be dynamically included based on token budgets and prompt types.
 */

/**
 * Categories of prompt types that examples can apply to
 */
export type PromptCategory =
  | 'scene'
  | 'transition'
  | 'choice'
  | 'skill-acknowledgment'
  | 'initial-scene'
  | 'action'
  | 'ending'
  | 'all'; // Applies to all prompt types

/**
 * Priority level for examples
 * Higher priority examples are more likely to be included when token budget is limited
 */
export type ExamplePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Represents a single example that demonstrates desired AI output
 */
export interface PromptExample {
  /** Unique identifier for the example */
  id: string;

  /** Human-readable name for the example */
  name: string;

  /** Brief description of what this example demonstrates */
  description: string;

  /** The actual example content/text */
  content: string;

  /** Categories this example applies to */
  categories: PromptCategory[];

  /** Priority level for inclusion decisions */
  priority: ExamplePriority;

  /** Optional tags for additional categorization */
  tags?: string[];

  /** Estimated token count (calculated automatically if not provided) */
  tokenCount?: number;
}

/**
 * Options for selecting examples based on context and constraints
 */
export interface ExampleSelectionOptions {
  /** The prompt category to select examples for */
  category: PromptCategory;

  /** Maximum tokens available for examples */
  tokenBudget: number;

  /** Minimum priority level to include (filters out lower priority) */
  minPriority?: ExamplePriority;

  /** Specific tags to filter by */
  tags?: string[];

  /** Maximum number of examples to include */
  maxExamples?: number;
}

/**
 * Result of example selection with metadata
 */
export interface ExampleSelectionResult {
  /** Selected examples in priority order */
  examples: PromptExample[];

  /** Total token count of selected examples */
  totalTokens: number;

  /** Number of examples that were excluded due to constraints */
  excludedCount: number;

  /** Formatted string of examples ready for prompt inclusion */
  formattedContent: string;
}
