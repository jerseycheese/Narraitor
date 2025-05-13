import { PromptContextManager } from '../../promptContextManager';
import { AIPromptProcessor } from '../../../ai/aiPromptProcessor';
import { PromptTemplateManager } from '../../../promptTemplates/promptTemplateManager';
import { createMockWorld, createMockCharacter } from '../test-helpers';
import { WorldContext, CharacterContext } from '../../types';

// Mock the GeminiClient
jest.mock('../../../ai/geminiClient');

describe('PromptContextManager AI Service Integration', () => {
  let contextManager: PromptContextManager;
  let templateManager: PromptTemplateManager;

  beforeEach(() => {
    contextManager = new PromptContextManager();
    templateManager = new PromptTemplateManager();
    
    // Mock AI setup
    const mockGeminiClient = {
      generateContent: jest.fn()
    };
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GeminiClient } = require('../../../ai/geminiClient');
    GeminiClient.mockImplementation(() => mockGeminiClient);
    
    // Note: aiProcessor is created but not used in these tests
    // which focus on context generation rather than AI processing
    new AIPromptProcessor({
      templateManager,
      config: {
        geminiApiKey: 'test-key',
        modelName: 'gemini-pro',
        maxRetries: 3,
        timeout: 30000
      }
    });
  });

  describe('Production scenario testing', () => {
    test('should handle large world with complex character', async () => {
      // Test Scenario: Large world with complex character
      const largeWorld = createMockWorld({
        description: 'A vast sprawling fantasy empire with multiple kingdoms...',
        attributes: Array(6).fill(null).map((_, i) => ({
          id: `attr-${i}`,
          name: `Attribute${i}`,
          description: `Description for attribute ${i}`
        })),
        skills: Array(12).fill(null).map((_, i) => ({
          id: `skill-${i}`,
          name: `Skill${i}`,
          description: `Description for skill ${i}`
        }))
      });
      
      const complexCharacter = createMockCharacter({
        attributes: Array(6).fill(null).map((_, i) => ({
          attributeId: `attr-${i}`,
          name: `Attribute${i}`,
          value: 5
        })),
        skills: Array(8).fill(null).map((_, i) => ({
          skillId: `skill-${i}`,
          name: `Skill${i}`,
          value: 3
        })),
        inventory: Array(10).fill(null).map((_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          quantity: 1
        }))
      });
      
      const contextResult = await contextManager.generateContext({
        world: largeWorld,
        character: complexCharacter,
        tokenLimit: 2000
      });
      
      // Verify context generation handles large data
      expect(contextResult.context).toBeTruthy();
      expect(contextResult.finalTokenCount).toBeLessThanOrEqual(2000);
      expect(contextResult.contextRetentionPercentage).toBeGreaterThan(0);
    });

    test('should handle multiple characters in same world', async () => {
      // Test Scenario: Multiple characters in same world
      const world = createMockWorld();
      const character1 = createMockCharacter({ name: 'Hero One' });
      const character2 = createMockCharacter({ name: 'Hero Two' });
      
      // Generate context for both characters
      const context1 = await contextManager.generateContext({
        world,
        character: character1,
        tokenLimit: 1000
      });
      
      const context2 = await contextManager.generateContext({
        world,
        character: character2,
        tokenLimit: 1000
      });
      
      // Verify both contexts are different but contain world info
      expect(context1.context).not.toBe(context2.context);
      expect(context1.context).toContain(world.name);
      expect(context2.context).toContain(world.name);
      expect(context1.context).toContain(character1.name);
      expect(context2.context).toContain(character2.name);
    });
  });

  describe('Edge case handling', () => {
    test('should handle null data gracefully', async () => {
      // Test Scenario: Edge cases (null data)
      const contextResult = await contextManager.generateContext({
        world: null,
        character: null,
        tokenLimit: 500
      });
      
      expect(contextResult.context).toBe('');
      expect(contextResult.finalTokenCount).toBe(0);
      expect(contextResult.contextRetentionPercentage).toBe(100);
    });

    test('should handle missing fields', async () => {
      // Test Scenario: Edge cases (missing fields)
      const incompleteWorld: Partial<WorldContext> = {
        id: 'incomplete-world',
        name: 'Incomplete World',
        // Missing other required fields
      };
      
      const incompleteCharacter: Partial<CharacterContext> = {
        id: 'incomplete-char',
        name: 'Incomplete Character',
        // Missing other required fields
      };
      
      const contextResult = await contextManager.generateContext({
        world: incompleteWorld as WorldContext,
        character: incompleteCharacter as CharacterContext,
        tokenLimit: 500
      });
      
      // Should handle incomplete data without crashing
      expect(contextResult.context).toBeTruthy();
      expect(contextResult.context).toContain('Incomplete World');
      expect(contextResult.context).toContain('Incomplete Character');
    });
  });
});
