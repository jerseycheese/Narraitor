/**
 * @fileoverview Example Manager for dynamic example selection
 *
 * Manages a library of prompt examples and selects appropriate examples
 * based on token budgets, prompt categories, and priority levels.
 */

import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';
import {
  PromptExample,
  ExampleSelectionOptions,
  ExampleSelectionResult,
  ExampleLibraryConfig,
  ExamplePriority,
  PromptCategory,
} from './types';

/**
 * Priority levels mapped to numeric values for comparison
 */
const PRIORITY_VALUES: Record<ExamplePriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Default token budget for examples if not specified
 */
const DEFAULT_TOKEN_BUDGET = 200;

/**
 * Manages prompt examples with intelligent selection based on token budgets
 *
 * This class provides centralized management of example-driven prompting,
 * allowing developers to:
 * - Register examples for different prompt types
 * - Automatically select examples based on available token budget
 * - Prioritize critical examples over less important ones
 * - Format examples consistently for prompt inclusion
 */
export class ExampleManager {
  private examples: Map<string, PromptExample> = new Map();
  private config: ExampleLibraryConfig;

  constructor(config: ExampleLibraryConfig = {}) {
    this.config = {
      defaultTokenBudget: DEFAULT_TOKEN_BUDGET,
      autoCalculateTokens: true,
      ...config,
    };
  }

  /**
   * Adds an example to the library
   * @param example - The example to add
   * @throws Error if an example with the same ID already exists
   */
  addExample(example: PromptExample): void {
    if (this.examples.has(example.id)) {
      throw new Error(`Example with id '${example.id}' already exists`);
    }

    // Auto-calculate token count if enabled and not provided
    const exampleWithTokens = {
      ...example,
      tokenCount:
        example.tokenCount ??
        (this.config.autoCalculateTokens
          ? estimateTokenCount(example.content)
          : 0),
    };

    this.examples.set(example.id, exampleWithTokens);
  }

  /**
   * Adds multiple examples at once
   * @param examples - Array of examples to add
   */
  addExamples(examples: PromptExample[]): void {
    examples.forEach((example) => this.addExample(example));
  }

  /**
   * Retrieves an example by ID
   * @param id - The example ID
   * @returns The example or undefined if not found
   */
  getExample(id: string): PromptExample | undefined {
    return this.examples.get(id);
  }

  /**
   * Retrieves all examples
   * @returns Array of all examples
   */
  getAllExamples(): PromptExample[] {
    return Array.from(this.examples.values());
  }

  /**
   * Removes an example from the library
   * @param id - The example ID to remove
   * @returns True if example was removed, false if not found
   */
  removeExample(id: string): boolean {
    return this.examples.delete(id);
  }

  /**
   * Clears all examples from the library
   */
  clearExamples(): void {
    this.examples.clear();
  }

  /**
   * Selects examples intelligently based on options and token budget
   *
   * This is the core method that implements token-aware example selection:
   * 1. Filters examples by category and minimum priority
   * 2. Sorts by priority (highest first)
   * 3. Greedily selects examples until token budget is exhausted
   * 4. Returns formatted content ready for prompt inclusion
   *
   * @param options - Selection criteria and constraints
   * @returns Selected examples with metadata
   */
  selectExamples(options: ExampleSelectionOptions): ExampleSelectionResult {
    const {
      category,
      tokenBudget,
      minPriority,
      tags,
      maxExamples,
    } = options;

    // Filter examples by category
    let candidates = this.filterByCategory(category);

    // Filter by minimum priority if specified
    if (minPriority) {
      candidates = this.filterByPriority(candidates, minPriority);
    }

    // Filter by tags if specified
    if (tags && tags.length > 0) {
      candidates = this.filterByTags(candidates, tags);
    }

    // Sort by priority (highest first), then by token count (lowest first for efficiency)
    candidates.sort((a, b) => {
      const priorityDiff =
        PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // For same priority, prefer smaller examples to fit more
      return (a.tokenCount || 0) - (b.tokenCount || 0);
    });

    // Greedily select examples within token budget
    const selected: PromptExample[] = [];
    let totalTokens = 0;

    for (const example of candidates) {
      const exampleTokens = example.tokenCount || 0;

      // Check if we've hit max examples limit
      if (maxExamples && selected.length >= maxExamples) {
        break;
      }

      // Check if adding this example would exceed budget
      if (totalTokens + exampleTokens <= tokenBudget) {
        selected.push(example);
        totalTokens += exampleTokens;
      }
    }

    const excludedCount = candidates.length - selected.length;
    const formattedContent = this.formatExamples(selected);

    return {
      examples: selected,
      totalTokens,
      excludedCount,
      formattedContent,
    };
  }

  /**
   * Filters examples by category
   * @param category - The category to filter by
   * @returns Filtered examples
   */
  private filterByCategory(category: PromptCategory): PromptExample[] {
    return this.getAllExamples().filter(
      (example) =>
        example.categories.includes(category) ||
        example.categories.includes('all')
    );
  }

  /**
   * Filters examples by minimum priority level
   * @param examples - Examples to filter
   * @param minPriority - Minimum priority level
   * @returns Filtered examples
   */
  private filterByPriority(
    examples: PromptExample[],
    minPriority: ExamplePriority
  ): PromptExample[] {
    const minValue = PRIORITY_VALUES[minPriority];
    return examples.filter(
      (example) => PRIORITY_VALUES[example.priority] >= minValue
    );
  }

  /**
   * Filters examples by tags (must have at least one matching tag)
   * @param examples - Examples to filter
   * @param tags - Tags to match
   * @returns Filtered examples
   */
  private filterByTags(
    examples: PromptExample[],
    tags: string[]
  ): PromptExample[] {
    return examples.filter((example) =>
      tags.some((tag) => example.tags?.includes(tag))
    );
  }

  /**
   * Formats examples for inclusion in prompts
   * Uses custom formatter if provided, otherwise uses default format
   *
   * @param examples - Examples to format
   * @returns Formatted string
   */
  private formatExamples(examples: PromptExample[]): string {
    if (this.config.formatter) {
      return this.config.formatter(examples);
    }

    if (examples.length === 0) {
      return '';
    }

    const sections = examples.map((example, index) => {
      const header = `Example ${index + 1}: ${example.name}`;
      const separator = '-'.repeat(header.length);
      return `${header}\n${separator}\n${example.content}`;
    });

    return `\n\nEXAMPLES:\n${sections.join('\n\n')}`;
  }

  /**
   * Gets statistics about the example library
   * @returns Statistics object
   */
  getStats(): {
    totalExamples: number;
    examplesByCategory: Record<string, number>;
    examplesByPriority: Record<ExamplePriority, number>;
    totalTokens: number;
  } {
    const examples = this.getAllExamples();
    const stats = {
      totalExamples: examples.length,
      examplesByCategory: {} as Record<string, number>,
      examplesByPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      } as Record<ExamplePriority, number>,
      totalTokens: 0,
    };

    examples.forEach((example) => {
      // Count by category
      example.categories.forEach((category) => {
        stats.examplesByCategory[category] =
          (stats.examplesByCategory[category] || 0) + 1;
      });

      // Count by priority
      stats.examplesByPriority[example.priority]++;

      // Sum tokens
      stats.totalTokens += example.tokenCount || 0;
    });

    return stats;
  }
}

// Export singleton instance
export const exampleManager = new ExampleManager();
