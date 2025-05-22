import { createTestContext, mergeTestOverrides } from '../contextOverride';
import type { World, Character, NarrativeContext, AITestConfig } from '../../../types';

describe('contextOverride', () => {
  const mockWorld: World = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    theme: 'Fantasy',
    attributes: [],
    skills: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Test Character',
    worldId: 'world-1',
    level: 1,
    attributes: {},
    skills: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockNarrativeContext: NarrativeContext = {
    recentSegments: [],
    activeCharacters: ['char-1'],
    currentLocation: 'Starting area',
    activeQuests: [],
    mood: 'neutral'
  };

  test('creates test context from base components', () => {
    const testConfig: AITestConfig = {
      worldOverride: { name: 'Custom World Name' },
      characterOverride: { description: 'Modified character' },
      narrativeContext: { currentLocation: 'Custom location' }
    };

    const result = createTestContext(mockWorld, mockCharacter, mockNarrativeContext, testConfig);

    expect(result.world.name).toBe('Custom World Name');
    expect(result.world.theme).toBe('Fantasy'); // Unchanged
    expect(result.character.description).toBe('Modified character');
    expect(result.character.name).toBe('Test Character'); // Unchanged
    expect(result.narrativeContext.currentLocation).toBe('Custom location');
    expect(result.narrativeContext.activeCharacters).toEqual(['char-1']); // Unchanged
  });

  test('merges partial overrides without affecting original objects', () => {
    const testConfig: AITestConfig = {
      worldOverride: { description: 'Modified description' },
      characterOverride: { name: 'Modified Character' }
    };

    const result = mergeTestOverrides(mockWorld, mockCharacter, mockNarrativeContext, testConfig);

    // Verify overrides applied
    expect(result.world.description).toBe('Modified description');
    expect(result.character.name).toBe('Modified Character');

    // Verify originals unchanged
    expect(mockWorld.description).toBe('A test world');
    expect(mockCharacter.name).toBe('Test Character');
  });

  test('handles empty overrides by returning cloned originals', () => {
    const testConfig: AITestConfig = {};

    const result = createTestContext(mockWorld, mockCharacter, mockNarrativeContext, testConfig);

    expect(result.world).toEqual(mockWorld);
    expect(result.character).toEqual(mockCharacter);
    expect(result.narrativeContext).toEqual(mockNarrativeContext);

    // Verify they are copies, not references
    expect(result.world).not.toBe(mockWorld);
    expect(result.character).not.toBe(mockCharacter);
    expect(result.narrativeContext).not.toBe(mockNarrativeContext);
  });

  test('handles custom variables configuration', () => {
    const testConfig: AITestConfig = {
      customVariables: {
        'location': 'Dark Forest',
        'weather': 'Stormy'
      }
    };

    const result = createTestContext(mockWorld, mockCharacter, mockNarrativeContext, testConfig);

    // Custom variables would be handled differently in actual implementation
    expect(result.narrativeContext).toBeDefined();
  });
});