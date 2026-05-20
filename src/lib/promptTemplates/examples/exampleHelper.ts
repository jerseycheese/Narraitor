/**
 * @fileoverview Example Helper Utilities
 *
 * Provides convenient functions for templates to access examples
 * with token-aware selection.
 */

import { exampleManager, ExampleManager } from './exampleManager';
import { allExamples } from './exampleLibrary';
import { PromptCategory, ExampleSelectionOptions } from './types';

/**
 * Initialize the global example manager with all examples
 * This should be called once at application startup
 */
function initializeExampleLibrary(): void {
  // Clear any existing examples
  exampleManager.clearExamples();

  // Add all examples from the library
  exampleManager.addExamples(allExamples);
}

/**
 * Get formatted examples for a specific prompt category with token budget
 *
 * @param category - The prompt category
 * @param tokenBudget - Maximum tokens to use for examples (default: 150)
 * @param options - Additional selection options
 * @returns Formatted example string ready for prompt inclusion
 */
export function getExamplesForPrompt(
  category: PromptCategory,
  tokenBudget: number = 150,
  options: Partial<ExampleSelectionOptions> = {}
): string {
  const result = exampleManager.selectExamples({
    category,
    tokenBudget,
    ...options,
  });

  return result.formattedContent;
}

/**
 * Get examples with custom manager instance (useful for testing)
 *
 * @param manager - Custom ExampleManager instance
 * @param category - The prompt category
 * @param tokenBudget - Maximum tokens to use
 * @param options - Additional selection options
 * @returns Formatted example string
 */
function getExamplesWithManager(
  manager: ExampleManager,
  category: PromptCategory,
  tokenBudget: number = 150,
  options: Partial<ExampleSelectionOptions> = {}
): string {
  const result = manager.selectExamples({
    category,
    tokenBudget,
    ...options,
  });

  return result.formattedContent;
}

/**
 * Check if examples should be included based on context
 *
 * This function determines whether examples add value for the current context.
 * Examples are excluded when:
 * - Token budget is very limited (< 50 tokens available)
 * - Context is already very long and examples would be redundant
 *
 * @param availableTokens - Tokens available in the budget
 * @param contextLength - Length of the existing context
 * @returns True if examples should be included
 */
export function shouldIncludeExamples(
  availableTokens: number,
  contextLength: number = 0
): boolean {
  // Don't include examples if we have very limited tokens
  if (availableTokens < 50) {
    return false;
  }

  // Don't include examples if context is already very long
  // (assumes examples would be redundant with extensive context)
  if (contextLength > 5000) {
    return false;
  }

  return true;
}

// Initialize the library on module load
initializeExampleLibrary();
