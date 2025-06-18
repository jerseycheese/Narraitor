import { evaluateRequirement } from '../requirementEvaluator';
import { DecisionRequirement } from '@/types/narrative.types';
import { Character } from '@/types/character.types';

describe('evaluateRequirement', () => {
  const mockCharacter: Character = {
    id: 'char1',
    name: 'Test Character',
    description: 'A test character',
    worldId: 'world1',
    attributes: [
      { attributeId: 'strength', value: 8 },
      { attributeId: 'dexterity', value: 12 }
    ],
    skills: [
      { skillId: 'intimidation', level: 6, experience: 100, isActive: true },
      { skillId: 'stealth', level: 3, experience: 50, isActive: true }
    ],
    background: {
      history: 'Test',
      personality: 'Test',
      goals: [],
      fears: [],
      relationships: []
    },
    inventory: { characterId: 'char1', items: [], capacity: 20, categories: [] },
    status: { health: 100, maxHealth: 100, conditions: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('returns true for skill requirement that is met', () => {
    const requirement: DecisionRequirement = {
      type: 'skill',
      targetId: 'intimidation',
      operator: 'gte',
      value: 5
    };

    const result = evaluateRequirement(requirement, mockCharacter);
    expect(result.success).toBe(true);
    expect(result.current).toBe(6);
    expect(result.required).toBe(5);
  });

  it('returns false for skill requirement that is not met', () => {
    const requirement: DecisionRequirement = {
      type: 'skill',
      targetId: 'stealth',
      operator: 'gte',
      value: 5
    };

    const result = evaluateRequirement(requirement, mockCharacter);
    expect(result.success).toBe(false);
    expect(result.current).toBe(3);
    expect(result.required).toBe(5);
  });

  it('returns false for skill not found', () => {
    const requirement: DecisionRequirement = {
      type: 'skill',
      targetId: 'nonexistent',
      operator: 'gte',
      value: 1
    };

    const result = evaluateRequirement(requirement, mockCharacter);
    expect(result.success).toBe(false);
    expect(result.current).toBe(0);
  });
});