// src/types/__tests__/ai-context.types.test.ts
import { 
  AIContext, 
  AIPromptContext
} from '../ai-context.types';

describe('AI Context Types', () => {
  describe('AIContext interface', () => {
    test('should create a complete AI context', () => {
      const context: AIContext = {
        world: {
          id: 'world-1',
          name: 'Western World',
          theme: 'western',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 6,
            maxSkills: 8,
            attributePointPool: 27,
            skillPointPool: 20
          },
          createdAt: '2025-01-13T10:00:00Z',
          updatedAt: '2025-01-13T10:00:00Z'
        },
        character: {
          id: 'char-1',
          worldId: 'world-1',
          name: 'John Doe',
          attributes: [],
          skills: [],
          background: {
            history: 'A lone gunslinger',
            personality: 'Stoic',
            goals: [],
            fears: [],
            relationships: []
          },
          inventory: {
            characterId: 'char-1',
            items: [],
            capacity: 10,
            categories: []
          },
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          createdAt: '2025-01-13T10:00:00Z',
          updatedAt: '2025-01-13T10:00:00Z'
        },
        recentNarrative: [],
        currentObjectives: ['Find the sheriff']
      };

      expect(context.world.theme).toBe('western');
      expect(context.character.name).toBe('John Doe');
      expect(context.currentObjectives).toHaveLength(1);
    });
  });

  describe('AIPromptContext interface', () => {
    test('should create prompt context with constraints', () => {
      const promptContext: AIPromptContext = {
        templateId: 'narrative-scene',
        variables: {
          scene: 'saloon',
          time: 'evening'
        },
        context: {} as AIContext, // Mock for brevity
        constraints: [
          {
            type: 'tone',
            value: 'serious',
            priority: 'required'
          },
          {
            type: 'length',
            value: 200,
            priority: 'preferred'
          }
        ]
      };

      expect(promptContext.constraints).toHaveLength(2);
      expect(promptContext.constraints?.[0].priority).toBe('required');
    });
  });
});
