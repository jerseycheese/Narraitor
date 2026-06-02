/**
 * @fileoverview Example selection for dynamic prompt examples
 *
 * Selects appropriate examples from a static library based on token budgets,
 * prompt categories, and priority levels, then formats them for prompt inclusion.
 */

import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';
import {
  PromptExample,
  ExampleSelectionOptions,
  ExampleSelectionResult,
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

const withTokenCount = (example: PromptExample): PromptExample => ({
  ...example,
  tokenCount: example.tokenCount ?? estimateTokenCount(example.content),
});

const filterByCategory = (
  examples: PromptExample[],
  category: PromptCategory
): PromptExample[] =>
  examples.filter(
    (example) =>
      example.categories.includes(category) ||
      example.categories.includes('all')
  );

const filterByPriority = (
  examples: PromptExample[],
  minPriority: ExamplePriority
): PromptExample[] => {
  const minValue = PRIORITY_VALUES[minPriority];
  return examples.filter(
    (example) => PRIORITY_VALUES[example.priority] >= minValue
  );
};

const filterByTags = (
  examples: PromptExample[],
  tags: string[]
): PromptExample[] =>
  examples.filter((example) =>
    tags.some((tag) => example.tags?.includes(tag))
  );

/**
 * Formats examples for inclusion in prompts.
 */
export function formatExamples(examples: PromptExample[]): string {
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
 * Selects examples from the given library within a token budget.
 *
 * 1. Filters by category and (optionally) minimum priority and tags.
 * 2. Sorts by priority (highest first), then token count (lowest first).
 * 3. Greedily selects examples until the token budget is exhausted.
 * 4. Returns the selection plus formatted content ready for prompt inclusion.
 */
export function selectExamples(
  library: PromptExample[],
  options: ExampleSelectionOptions
): ExampleSelectionResult {
  const { category, tokenBudget, minPriority, tags, maxExamples } = options;

  let candidates = filterByCategory(library.map(withTokenCount), category);

  if (minPriority) {
    candidates = filterByPriority(candidates, minPriority);
  }

  if (tags && tags.length > 0) {
    candidates = filterByTags(candidates, tags);
  }

  // Sort by priority (highest first), then by token count (lowest first for efficiency)
  candidates.sort((a, b) => {
    const priorityDiff =
      PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return (a.tokenCount || 0) - (b.tokenCount || 0);
  });

  const selected: PromptExample[] = [];
  let totalTokens = 0;

  for (const example of candidates) {
    const exampleTokens = example.tokenCount || 0;

    if (maxExamples && selected.length >= maxExamples) {
      break;
    }

    if (totalTokens + exampleTokens <= tokenBudget) {
      selected.push(example);
      totalTokens += exampleTokens;
    }
  }

  return {
    examples: selected,
    totalTokens,
    excludedCount: candidates.length - selected.length,
    formattedContent: formatExamples(selected),
  };
}
