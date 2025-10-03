import { useCharacterStore } from '../characterStore';

describe('useCharacterStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    useCharacterStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
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
        description: 'A test character',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'A test character',
          personality: 'Friendly',
          goals: ['Testing'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
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
        description: '',
        worldId: '',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
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
        description: 'Original character description',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'Original description',
          personality: 'Original personality',
          goals: ['Original motivation'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
      });

      const originalUpdatedAt = useCharacterStore.getState().characters[characterId].updatedAt;

      // Advance time by 1 second to ensure timestamp difference
      jest.setSystemTime(new Date('2025-01-15T12:00:01Z'));

      useCharacterStore.getState().updateCharacter(characterId, {
        name: 'Updated Character',
        background: {
          history: 'Updated description',
          personality: 'Updated personality',
          goals: ['Updated goals'],
          fears: [],
          relationships: []
        }
      });

      const state = useCharacterStore.getState();
      expect(state.characters[characterId].name).toBe('Updated Character');
      expect(state.characters[characterId].background.history).toBe('Updated description');
      expect(state.characters[characterId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent character', () => {
      useCharacterStore.getState().updateCharacter('non-existent-id', { name: 'Updated' });
      const state = useCharacterStore.getState();
      expect(state.error).toMatchObject({
        title: 'Character Not Found',
        message: 'The specified character could not be found',
        type: 'validation'
      });
    });
  });

  describe('deleteCharacter', () => {
    test('should remove character from store', () => {
      const characterId = useCharacterStore.getState().createCharacter({
        name: 'To Delete',
        description: 'Character to be deleted',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'Will be deleted',
          personality: 'N/A',
          goals: [],
          fears: [],
          relationships: []
        },
        isPlayer: false,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
      });

      useCharacterStore.getState().deleteCharacter(characterId);
      const state = useCharacterStore.getState();

      expect(state.characters[characterId]).toBeUndefined();
    });

    test('should clear currentCharacterId if deleted character was current', () => {
      const characterId = useCharacterStore.getState().createCharacter({
        name: 'Current Character',
        description: 'Currently selected character',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'Currently selected',
          personality: 'Active',
          goals: ['Playing'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
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
        description: 'Character to be selected',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'To be selected',
          personality: 'Ready',
          goals: ['Playing'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
      });

      useCharacterStore.getState().setCurrentCharacter(characterId);
      const state = useCharacterStore.getState();

      expect(state.currentCharacterId).toBe(characterId);
    });

    test('should handle non-existent character', () => {
      useCharacterStore.getState().setCurrentCharacter('non-existent-id');
      const state = useCharacterStore.getState();
      expect(state.error).toMatchObject({
        title: 'Character Not Found',
        message: 'The specified character could not be found',
        type: 'validation'
      });
      expect(state.currentCharacterId).toBeNull();
    });
  });

  describe('attribute management', () => {
    let characterId: string;

    beforeEach(() => {
      characterId = useCharacterStore.getState().createCharacter({
        name: 'Attribute Test Character',
        description: 'Character for testing attributes',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'For testing attributes',
          personality: 'Test',
          goals: ['Testing'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
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
        description: 'Character for testing skills',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'For testing skills',
          personality: 'Test',
          goals: ['Testing'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
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
      expect(state.error).toMatchObject({
        title: 'Maximum Skills Reached',
        message: 'This character has reached its maximum number of skills',
        type: 'validation'
      });
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
        description: 'Character for reset test',
        worldId: 'world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          history: 'Test',
          personality: 'Test',
          goals: ['Test'],
          fears: [],
          relationships: []
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: []
        }
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
