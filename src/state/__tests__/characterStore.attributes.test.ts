/**
 * Tests for CharacterStore Attribute and Skill Management
 *
 * Verifies adding, updating, and removing attributes and skills from characters.
 */

import { useCharacterStore } from '../characterStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import {
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

  describe('skill management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = useCharacterStore.getState().createCharacter(
        createSkillTestCharacter()
      );
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
        type: ErrorType.VALIDATION
      });
    });
  });
});
