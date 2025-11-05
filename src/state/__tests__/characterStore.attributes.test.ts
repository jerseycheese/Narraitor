/**
 * Tests for CharacterStore Attribute and Skill Management
 *
 * Verifies adding, updating, and removing attributes and skills from characters.
 */

import { useCharacterStore } from '../characterStore';
import {
  createAttributeTestCharacter,
  createSkillTestCharacter,
  setupTestTimers
} from './characterStore.testHelpers';

describe('useCharacterStore - Attribute and Skill Management', () => {
  beforeEach(() => {
    setupTestTimers();
    useCharacterStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('attribute management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = useCharacterStore.getState().createCharacter(
        createAttributeTestCharacter()
      );
    });

    test('should add attribute to character', () => {
      const attributeData = {
        name: 'Strength',
        baseValue: 10,
        modifiedValue: 10,
        category: 'Physical'
      };

      useCharacterStore.getState().addAttribute(characterId, attributeData);
      const state = useCharacterStore.getState();
      const character = state.characters[characterId];

      expect(character.attributes).toHaveLength(1);
      expect(character.attributes[0].name).toBe('Strength');
      expect(character.attributes[0].characterId).toBe(characterId);
    });

    test('should update attribute', () => {
      useCharacterStore.getState().addAttribute(characterId, {
        name: 'Strength',
        baseValue: 10,
        modifiedValue: 10,
        category: 'Physical'
      });

      const state = useCharacterStore.getState();
      const attributeId = state.characters[characterId].attributes[0].id;

      useCharacterStore.getState().updateAttribute(characterId, attributeId, {
        baseValue: 12,
        modifiedValue: 14
      });

      const updatedState = useCharacterStore.getState();
      const attribute = updatedState.characters[characterId].attributes[0];
      expect(attribute.baseValue).toBe(12);
      expect(attribute.modifiedValue).toBe(14);
    });

    test('should remove attribute', () => {
      useCharacterStore.getState().addAttribute(characterId, {
        name: 'Strength',
        baseValue: 10,
        modifiedValue: 10,
        category: 'Physical'
      });

      const state = useCharacterStore.getState();
      const attributeId = state.characters[characterId].attributes[0].id;

      useCharacterStore.getState().removeAttribute(characterId, attributeId);

      const updatedState = useCharacterStore.getState();
      expect(updatedState.characters[characterId].attributes).toHaveLength(0);
    });
  });

  describe('skill management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = useCharacterStore.getState().createCharacter(
        createSkillTestCharacter()
      );
    });

    test('should add skill to character', () => {
      const skillData = {
        name: 'Swordsmanship',
        level: 3,
        category: 'Combat'
      };

      useCharacterStore.getState().addSkill(characterId, skillData);
      const state = useCharacterStore.getState();
      const character = state.characters[characterId];

      expect(character.skills).toHaveLength(1);
      expect(character.skills[0].name).toBe('Swordsmanship');
      expect(character.skills[0].characterId).toBe(characterId);
    });

    test('should enforce max skills limit', () => {
      // This would need to reference world settings
      // Simplified version for the test
      const maxSkills = 2;

      for (let i = 0; i < maxSkills; i++) {
        useCharacterStore.getState().addSkill(characterId, {
          name: `Skill ${i + 1}`,
          level: 1,
          category: 'General'
        });
      }

      // Try to add one more skill beyond the limit
      useCharacterStore.getState().addSkill(characterId, {
        name: 'Extra Skill',
        level: 1,
        category: 'General'
      });

      const state = useCharacterStore.getState();
      expect(state.characters[characterId].skills).toHaveLength(maxSkills);
      expect(state.error).toMatchObject({
        title: 'Maximum Skills Reached',
        message: 'This character has reached its maximum number of skills',
        type: 'validation'
      });
    });
  });
});
