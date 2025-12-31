/**
 * @fileoverview Tests for ExampleManager
 */

import { ExampleManager } from './exampleManager';
import { PromptExample } from './types';

describe('ExampleManager', () => {
  let manager: ExampleManager;

  beforeEach(() => {
    manager = new ExampleManager();
  });

  describe('addExample', () => {
    it('should add an example to the library', () => {
      const example: PromptExample = {
        id: 'test-1',
        name: 'Test Example',
        description: 'A test example',
        content: 'This is a test example content.',
        categories: ['scene'],
        priority: 'medium',
      };

      manager.addExample(example);

      const retrieved = manager.getExample('test-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-1');
      expect(retrieved?.name).toBe('Test Example');
    });

    it('should auto-calculate token count when enabled', () => {
      const example: PromptExample = {
        id: 'test-2',
        name: 'Auto Token Test',
        description: 'Test auto token calculation',
        content: 'One two three four five.',
        categories: ['scene'],
        priority: 'medium',
      };

      manager.addExample(example);

      const retrieved = manager.getExample('test-2');
      expect(retrieved?.tokenCount).toBeGreaterThan(0);
    });

    it('should throw error when adding duplicate ID', () => {
      const example: PromptExample = {
        id: 'duplicate',
        name: 'Duplicate',
        description: 'Duplicate test',
        content: 'Content',
        categories: ['scene'],
        priority: 'medium',
      };

      manager.addExample(example);

      expect(() => manager.addExample(example)).toThrow(
        "Example with id 'duplicate' already exists"
      );
    });

    it('should use provided token count instead of auto-calculating', () => {
      const example: PromptExample = {
        id: 'test-3',
        name: 'Manual Token',
        description: 'Manual token test',
        content: 'One two three four five.',
        categories: ['scene'],
        priority: 'medium',
        tokenCount: 100, // Manually set
      };

      manager.addExample(example);

      const retrieved = manager.getExample('test-3');
      expect(retrieved?.tokenCount).toBe(100);
    });
  });

  describe('addExamples', () => {
    it('should add multiple examples at once', () => {
      const examples: PromptExample[] = [
        {
          id: 'multi-1',
          name: 'Multi 1',
          description: 'First',
          content: 'Content 1',
          categories: ['scene'],
          priority: 'low',
        },
        {
          id: 'multi-2',
          name: 'Multi 2',
          description: 'Second',
          content: 'Content 2',
          categories: ['transition'],
          priority: 'high',
        },
      ];

      manager.addExamples(examples);

      expect(manager.getExample('multi-1')).toBeDefined();
      expect(manager.getExample('multi-2')).toBeDefined();
    });
  });

  describe('getExample', () => {
    it('should return undefined for non-existent example', () => {
      const result = manager.getExample('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllExamples', () => {
    it('should return all examples', () => {
      const examples: PromptExample[] = [
        {
          id: 'all-1',
          name: 'All 1',
          description: 'First',
          content: 'Content 1',
          categories: ['scene'],
          priority: 'low',
        },
        {
          id: 'all-2',
          name: 'All 2',
          description: 'Second',
          content: 'Content 2',
          categories: ['choice'],
          priority: 'high',
        },
      ];

      manager.addExamples(examples);

      const all = manager.getAllExamples();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no examples exist', () => {
      const all = manager.getAllExamples();
      expect(all).toHaveLength(0);
    });
  });

  describe('removeExample', () => {
    it('should remove an example', () => {
      const example: PromptExample = {
        id: 'remove-test',
        name: 'Remove Test',
        description: 'Test removal',
        content: 'Content',
        categories: ['scene'],
        priority: 'medium',
      };

      manager.addExample(example);
      expect(manager.getExample('remove-test')).toBeDefined();

      const removed = manager.removeExample('remove-test');
      expect(removed).toBe(true);
      expect(manager.getExample('remove-test')).toBeUndefined();
    });

    it('should return false when removing non-existent example', () => {
      const removed = manager.removeExample('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clearExamples', () => {
    it('should clear all examples', () => {
      const examples: PromptExample[] = [
        {
          id: 'clear-1',
          name: 'Clear 1',
          description: 'First',
          content: 'Content 1',
          categories: ['scene'],
          priority: 'low',
        },
        {
          id: 'clear-2',
          name: 'Clear 2',
          description: 'Second',
          content: 'Content 2',
          categories: ['choice'],
          priority: 'high',
        },
      ];

      manager.addExamples(examples);
      expect(manager.getAllExamples()).toHaveLength(2);

      manager.clearExamples();
      expect(manager.getAllExamples()).toHaveLength(0);
    });
  });

  describe('selectExamples', () => {
    beforeEach(() => {
      const examples: PromptExample[] = [
        {
          id: 'select-1',
          name: 'High Priority Scene',
          description: 'High priority example',
          content: 'Short content.',
          categories: ['scene'],
          priority: 'high',
          tokenCount: 10,
          tags: ['formatting'],
        },
        {
          id: 'select-2',
          name: 'Medium Priority Scene',
          description: 'Medium priority example',
          content: 'Medium length content here.',
          categories: ['scene'],
          priority: 'medium',
          tokenCount: 20,
          tags: ['formatting'],
        },
        {
          id: 'select-3',
          name: 'Low Priority Scene',
          description: 'Low priority example',
          content: 'Another piece of content.',
          categories: ['scene'],
          priority: 'low',
          tokenCount: 15,
        },
        {
          id: 'select-4',
          name: 'Critical Priority Choice',
          description: 'Critical choice example',
          content: 'Important choice example.',
          categories: ['choice'],
          priority: 'critical',
          tokenCount: 25,
        },
        {
          id: 'select-5',
          name: 'Universal Example',
          description: 'Applies to all',
          content: 'Universal content.',
          categories: ['all'],
          priority: 'high',
          tokenCount: 12,
        },
      ];

      manager.addExamples(examples);
    });

    it('should select examples for a specific category', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
      });

      // Should get scene examples and universal (all) examples
      expect(result.examples.length).toBeGreaterThan(0);
      expect(
        result.examples.every(
          (ex) =>
            ex.categories.includes('scene') ||
            ex.categories.includes('all')
        )
      ).toBe(true);
    });

    it('should respect token budget', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 25,
      });

      expect(result.totalTokens).toBeLessThanOrEqual(25);
    });

    it('should prioritize high priority examples', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 50,
      });

      // First example should be high priority
      expect(result.examples[0].priority).toBe('high');
    });

    it('should filter by minimum priority', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
        minPriority: 'medium',
      });

      // Should exclude low priority examples
      expect(
        result.examples.every(
          (ex) => ex.priority === 'high' || ex.priority === 'medium'
        )
      ).toBe(true);
    });

    it('should filter by tags', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
        tags: ['formatting'],
      });

      expect(
        result.examples.every((ex) => ex.tags?.includes('formatting'))
      ).toBe(true);
    });

    it('should respect maxExamples limit', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
        maxExamples: 2,
      });

      expect(result.examples.length).toBeLessThanOrEqual(2);
    });

    it('should include excluded count', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 15, // Very small budget
      });

      expect(result.excludedCount).toBeGreaterThan(0);
    });

    it('should return formatted content', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
      });

      expect(result.formattedContent).toContain('EXAMPLES:');
      expect(result.formattedContent.length).toBeGreaterThan(0);
    });

    it('should return empty result when no examples match', () => {
      const result = manager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
        tags: ['non-existent-tag'],
      });

      expect(result.examples).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.formattedContent).toBe('');
    });

    it('should include "all" category examples for any category', () => {
      const result = manager.selectExamples({
        category: 'transition',
        tokenBudget: 100,
      });

      // Should include the universal example
      expect(
        result.examples.some((ex) => ex.categories.includes('all'))
      ).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const examples: PromptExample[] = [
        {
          id: 'stats-1',
          name: 'Stats 1',
          description: 'First',
          content: 'Content 1',
          categories: ['scene', 'transition'],
          priority: 'high',
          tokenCount: 10,
        },
        {
          id: 'stats-2',
          name: 'Stats 2',
          description: 'Second',
          content: 'Content 2',
          categories: ['scene'],
          priority: 'medium',
          tokenCount: 20,
        },
        {
          id: 'stats-3',
          name: 'Stats 3',
          description: 'Third',
          content: 'Content 3',
          categories: ['choice'],
          priority: 'critical',
          tokenCount: 15,
        },
      ];

      manager.addExamples(examples);

      const stats = manager.getStats();

      expect(stats.totalExamples).toBe(3);
      expect(stats.examplesByCategory.scene).toBe(2);
      expect(stats.examplesByCategory.transition).toBe(1);
      expect(stats.examplesByCategory.choice).toBe(1);
      expect(stats.examplesByPriority.high).toBe(1);
      expect(stats.examplesByPriority.medium).toBe(1);
      expect(stats.examplesByPriority.critical).toBe(1);
      expect(stats.totalTokens).toBe(45);
    });

    it('should return zero stats for empty library', () => {
      const stats = manager.getStats();

      expect(stats.totalExamples).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });
  });

  describe('custom formatter', () => {
    it('should use custom formatter when provided', () => {
      const customManager = new ExampleManager({
        formatter: (examples) =>
          examples.map((ex) => ex.name).join(', '),
      });

      const examples: PromptExample[] = [
        {
          id: 'format-1',
          name: 'First',
          description: 'First example',
          content: 'Content 1',
          categories: ['scene'],
          priority: 'medium',
          tokenCount: 10,
        },
        {
          id: 'format-2',
          name: 'Second',
          description: 'Second example',
          content: 'Content 2',
          categories: ['scene'],
          priority: 'medium',
          tokenCount: 10,
        },
      ];

      customManager.addExamples(examples);

      const result = customManager.selectExamples({
        category: 'scene',
        tokenBudget: 100,
      });

      expect(result.formattedContent).toBe('First, Second');
    });
  });
});
