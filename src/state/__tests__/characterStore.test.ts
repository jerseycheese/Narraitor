import { useCharacterStore } from '../characterStore';

describe('useCharacterStore', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = useCharacterStore.getState();
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

      const characterId = useCharacterStore.getState().createCharacter(characterData);
      const state = useCharacterStore.getState();

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
        useCharacterStore.getState().createCharacter(invalidCharacterData);
      }).toThrow('Character name is required');
    });
  });

  describe('updateCharacter', () => {
    test('should update existing character', () => {
      const characterId = useCharacterStore.getState().createCharacter({
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

      const originalUpdatedAt = useCharacterStore.getState().characters[characterId].updatedAt;

      // Wait a moment to ensure timestamp difference
      jest.advanceTimersByTime(1);

      useCharacterStore.getState().updateCharacter(characterId, {
        name: 'Updated Character',
        background: {
          description: 'Updated description',
          personality: 'Updated personality',
          motivation: 'Updated motivation'
        }
      });

      const state = useCharacterStore.getState();
      expect(state.characters[characterId].name).toBe('Updated Character');
      expect(state.characters[characterId].background.description).toBe('Updated description');
      expect(state.characters[characterId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent character', () => {
      useCharacterStore.getState().updateCharacter('non-existent-id', { name: 'Updated' });
      const state = useCharacterStore.getState();
      expect(state.error).toBe('Character not found');
    });
  });

  describe('deleteCharacter', () => {
    test('should remove character from store', () => {
      const characterId = useCharacterStore.getState().createCharacter({
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

      useCharacterStore.getState().deleteCharacter(characterId);
      const state = useCharacterStore.getState();

      expect(state.characters[characterId]).toBeUndefined();
    });

    test('should clear currentCharacterId if deleted character was current', () => {
      const characterId = useCharacterStore.getState().createCharacter({
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

      useCharacterStore.getState().setCurrentCharacter(characterId);
      useCharacterStore.getState().deleteCharacter(characterId);
      const state = useCharacterStore.getState();

      expect(state.currentCharacterId).toBeNull();
    });
  });

  describe('setCurrentCharacter', () => {
    test('should set current character ID', () => {
      const characterId = useCharacterStore.getState().createCharacter({
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

      useCharacterStore.getState().setCurrentCharacter(characterId);
      const state = useCharacterStore.getState();

      expect(state.currentCharacterId).toBe(characterId);
    });

    test('should handle non-existent character', () => {
      useCharacterStore.getState().setCurrentCharacter('non-existent-id');
      const state = useCharacterStore.getState();
      expect(state.error).toBe('Character not found');
      expect(state.currentCharacterId).toBeNull();
    });
  });

  describe('attribute management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = useCharacterStore.getState().createCharacter({
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
      characterId = useCharacterStore.getState().createCharacter({
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
      expect(state.error).toBe('Maximum skills limit reached');
    });
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      useCharacterStore.getState().setError('Test error');
      expect(useCharacterStore.getState().error).toBe('Test error');

      useCharacterStore.getState().clearError();
      expect(useCharacterStore.getState().error).toBeNull();
    });
  });

  describe('loading state', () => {
    test('should set loading state', () => {
      useCharacterStore.getState().setLoading(true);
      expect(useCharacterStore.getState().loading).toBe(true);

      useCharacterStore.getState().setLoading(false);
      expect(useCharacterStore.getState().loading).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      useCharacterStore.getState().createCharacter({
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
      useCharacterStore.getState().setError('Some error');
      useCharacterStore.getState().setLoading(true);

      // Reset
      useCharacterStore.getState().reset();
      const state = useCharacterStore.getState();

      expect(state.characters).toEqual({});
      expect(state.currentCharacterId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
