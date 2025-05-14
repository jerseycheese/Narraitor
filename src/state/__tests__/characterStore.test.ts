import { characterStore } from '../characterStore';

describe('characterStore', () => {
  beforeEach(() => {
    characterStore.getState().reset();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = characterStore.getState();
      expect(state.characters).toEqual({});
      expect(state.currentCharacterId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('createCharacter', () => {
    test('should create a new character', () => {
      const characterData = {
        name: 'Test Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'A test character',
          personality: 'Friendly',
          motivation: 'Testing'
        },
        isPlayer: true
      };

      const characterId = characterStore.getState().createCharacter(characterData);
      const state = characterStore.getState();

      expect(characterId).toBeDefined();
      expect(state.characters[characterId]).toBeDefined();
      expect(state.characters[characterId].name).toBe('Test Character');
      expect(state.characters[characterId].worldId).toBe('world-1');
      expect(state.characters[characterId].createdAt).toBeDefined();
      expect(state.characters[characterId].updatedAt).toBeDefined();
    });

    test('should validate required fields', () => {
      const invalidCharacterData = {
        name: '',
        worldId: '',
        attributes: [],
        skills: [],
        background: {
          description: '',
          personality: '',
          motivation: ''
        },
        isPlayer: true
      };

      expect(() => {
        characterStore.getState().createCharacter(invalidCharacterData);
      }).toThrow('Character name is required');
    });
  });

  describe('updateCharacter', () => {
    test('should update existing character', () => {
      const characterId = characterStore.getState().createCharacter({
        name: 'Original Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'Original description',
          personality: 'Original personality',
          motivation: 'Original motivation'
        },
        isPlayer: true
      });

      const originalUpdatedAt = characterStore.getState().characters[characterId].updatedAt;

      // Wait a moment to ensure timestamp difference
      jest.advanceTimersByTime(1);

      characterStore.getState().updateCharacter(characterId, {
        name: 'Updated Character',
        background: {
          description: 'Updated description',
          personality: 'Updated personality',
          motivation: 'Updated motivation'
        }
      });

      const state = characterStore.getState();
      expect(state.characters[characterId].name).toBe('Updated Character');
      expect(state.characters[characterId].background.description).toBe('Updated description');
      expect(state.characters[characterId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent character', () => {
      characterStore.getState().updateCharacter('non-existent-id', { name: 'Updated' });
      const state = characterStore.getState();
      expect(state.error).toBe('Character not found');
    });
  });

  describe('deleteCharacter', () => {
    test('should remove character from store', () => {
      const characterId = characterStore.getState().createCharacter({
        name: 'To Delete',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'Will be deleted',
          personality: 'N/A',
          motivation: 'N/A'
        },
        isPlayer: false
      });

      characterStore.getState().deleteCharacter(characterId);
      const state = characterStore.getState();

      expect(state.characters[characterId]).toBeUndefined();
    });

    test('should clear currentCharacterId if deleted character was current', () => {
      const characterId = characterStore.getState().createCharacter({
        name: 'Current Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'Currently selected',
          personality: 'Active',
          motivation: 'Playing'
        },
        isPlayer: true
      });

      characterStore.getState().setCurrentCharacter(characterId);
      characterStore.getState().deleteCharacter(characterId);
      const state = characterStore.getState();

      expect(state.currentCharacterId).toBeNull();
    });
  });

  describe('setCurrentCharacter', () => {
    test('should set current character ID', () => {
      const characterId = characterStore.getState().createCharacter({
        name: 'Current Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'To be selected',
          personality: 'Ready',
          motivation: 'Playing'
        },
        isPlayer: true
      });

      characterStore.getState().setCurrentCharacter(characterId);
      const state = characterStore.getState();

      expect(state.currentCharacterId).toBe(characterId);
    });

    test('should handle non-existent character', () => {
      characterStore.getState().setCurrentCharacter('non-existent-id');
      const state = characterStore.getState();
      expect(state.error).toBe('Character not found');
      expect(state.currentCharacterId).toBeNull();
    });
  });

  describe('attribute management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = characterStore.getState().createCharacter({
        name: 'Attribute Test Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'For testing attributes',
          personality: 'Test',
          motivation: 'Testing'
        },
        isPlayer: true
      });
    });

    test('should add attribute to character', () => {
      const attributeData = {
        name: 'Strength',
        baseValue: 10,
        modifiedValue: 10,
        category: 'Physical'
      };

      characterStore.getState().addAttribute(characterId, attributeData);
      const state = characterStore.getState();
      const character = state.characters[characterId];

      expect(character.attributes).toHaveLength(1);
      expect(character.attributes[0].name).toBe('Strength');
      expect(character.attributes[0].characterId).toBe(characterId);
    });

    test('should update attribute', () => {
      characterStore.getState().addAttribute(characterId, {
        name: 'Strength',
        baseValue: 10,
        modifiedValue: 10,
        category: 'Physical'
      });

      const state = characterStore.getState();
      const attributeId = state.characters[characterId].attributes[0].id;

      characterStore.getState().updateAttribute(characterId, attributeId, {
        baseValue: 12,
        modifiedValue: 14
      });

      const updatedState = characterStore.getState();
      const attribute = updatedState.characters[characterId].attributes[0];
      expect(attribute.baseValue).toBe(12);
      expect(attribute.modifiedValue).toBe(14);
    });

    test('should remove attribute', () => {
      characterStore.getState().addAttribute(characterId, {
        name: 'Strength',
        baseValue: 10,
        modifiedValue: 10,
        category: 'Physical'
      });

      const state = characterStore.getState();
      const attributeId = state.characters[characterId].attributes[0].id;

      characterStore.getState().removeAttribute(characterId, attributeId);

      const updatedState = characterStore.getState();
      expect(updatedState.characters[characterId].attributes).toHaveLength(0);
    });
  });

  describe('skill management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = characterStore.getState().createCharacter({
        name: 'Skill Test Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'For testing skills',
          personality: 'Test',
          motivation: 'Testing'
        },
        isPlayer: true
      });
    });

    test('should add skill to character', () => {
      const skillData = {
        name: 'Swordsmanship',
        level: 3,
        category: 'Combat'
      };

      characterStore.getState().addSkill(characterId, skillData);
      const state = characterStore.getState();
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
        characterStore.getState().addSkill(characterId, {
          name: `Skill ${i + 1}`,
          level: 1,
          category: 'General'
        });
      }

      // Try to add one more skill beyond the limit
      characterStore.getState().addSkill(characterId, {
        name: 'Extra Skill',
        level: 1,
        category: 'General'
      });

      const state = characterStore.getState();
      expect(state.characters[characterId].skills).toHaveLength(maxSkills);
      expect(state.error).toBe('Maximum skills limit reached');
    });
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      characterStore.getState().setError('Test error');
      expect(characterStore.getState().error).toBe('Test error');

      characterStore.getState().clearError();
      expect(characterStore.getState().error).toBeNull();
    });
  });

  describe('loading state', () => {
    test('should set loading state', () => {
      characterStore.getState().setLoading(true);
      expect(characterStore.getState().loading).toBe(true);

      characterStore.getState().setLoading(false);
      expect(characterStore.getState().loading).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      characterStore.getState().createCharacter({
        name: 'Test Character',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          description: 'Test',
          personality: 'Test',
          motivation: 'Test'
        },
        isPlayer: true
      });
      characterStore.getState().setError('Some error');
      characterStore.getState().setLoading(true);

      // Reset
      characterStore.getState().reset();
      const state = characterStore.getState();

      expect(state.characters).toEqual({});
      expect(state.currentCharacterId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
