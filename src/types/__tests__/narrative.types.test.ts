// src/types/__tests__/narrative.types.test.ts
import {
  NarrativeSegment,
  Decision,
  Consequence
} from '../narrative.types';

describe('Narrative Types', () => {
  describe('NarrativeSegment interface', () => {
    test('should create a valid narrative segment', () => {
      const segment: NarrativeSegment = {
        id: 'seg-1',
        worldId: 'world-1',
        sessionId: 'session-1',
        content: 'The doors swing open...',
        type: 'scene',
        characterIds: ['char-1'],
        metadata: {
          mood: 'tense',
          tags: ['entrance', 'confrontation']
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(segment.type).toBe('scene');
      expect(segment.metadata.mood).toBe('tense');
      expect(segment.metadata.tags).toHaveLength(2);
    });
  });

  describe('Decision interface', () => {
    test('should create a decision with options', () => {
      const decision: Decision = {
        id: 'dec-1',
        prompt: 'How do you respond?',
        options: [
          {
            id: 'opt-1',
            text: 'Draw your weapon',
            requirements: [
              {
                type: 'skill',
                targetId: 'skill-gunslinging',
                operator: 'gte',
                value: 5
              }
            ]
          },
          {
            id: 'opt-2',
            text: 'Try to negotiate',
            hint: 'Might avoid conflict'
          }
        ]
      };

      expect(decision.options).toHaveLength(2);
      expect(decision.options[0].requirements).toHaveLength(1);
      expect(decision.options[1].hint).toBe('Might avoid conflict');
    });
  });

  describe('Consequence interface', () => {
    test('should create different types of consequences', () => {
      const attrConsequence: Consequence = {
        type: 'attribute',
        action: 'modify',
        targetId: 'attr-strength',
        value: -2,
        description: 'Wounded in combat'
      };

      const itemConsequence: Consequence = {
        type: 'item',
        action: 'add',
        targetId: 'item-gold',
        value: 50
      };

      const complexConsequence: Consequence = {
        type: 'narrative',
        action: 'modify',
        targetId: 'narrative-state',
        value: { questStatus: 'completed', reward: 100 }
      };

      expect(attrConsequence.type).toBe('attribute');
      expect(attrConsequence.value).toBe(-2);
      expect(itemConsequence.action).toBe('add');
      expect(complexConsequence.value).toEqual({ questStatus: 'completed', reward: 100 });
    });
  });
});

