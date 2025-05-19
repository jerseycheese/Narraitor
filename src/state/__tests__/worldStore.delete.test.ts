import { worldStore } from '../worldStore';
import { World } from '@/types/world.types';
import { generateId } from '@/lib/utils/generateId';

// Mock the persistence module
jest.mock('../persistence', () => ({
  persistWorldStore: jest.fn(),
  loadWorldStore: jest.fn(),
}));

import * as mockPersistence from '../persistence';

describe('worldStore - deleteWorld action', () => {
  let testWorld: World;

  beforeEach(() => {
    // Reset store and mocks
    worldStore.setState({
      worlds: {},
      currentWorldId: null,
      error: null,
      loading: false,
    });
    jest.clearAllMocks();

    // Create a test world
    testWorld = {
      id: generateId(),
      name: 'Test World',
      description: 'A world to test deletion',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        difficultyLevel: 'medium',
        magicLevel: 'medium',
        technologyLevel: 'medieval',
        combatFrequency: 'medium',
      },
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add test world to store
    worldStore.setState({
      worlds: { [testWorld.id]: testWorld },
    });
  });

  test('successfully deletes an existing world', () => {
    const initialWorldCount = Object.keys(worldStore.getState().worlds).length;
    expect(initialWorldCount).toBe(1);

    // Delete the world
    worldStore.getState().deleteWorld(testWorld.id);

    // Verify world is removed
    const state = worldStore.getState();
    expect(state.worlds[testWorld.id]).toBeUndefined();
    expect(Object.keys(state.worlds).length).toBe(0);
    
    // Verify persistence was called
    expect(mockPersistence.persistWorldStore).toHaveBeenCalledTimes(1);
  });

  test('does nothing when trying to delete non-existent world', () => {
    const nonExistentId = generateId();
    const initialState = worldStore.getState();

    // Attempt to delete non-existent world
    worldStore.getState().deleteWorld(nonExistentId);

    // Verify nothing changed
    const newState = worldStore.getState();
    expect(newState).toEqual(initialState);
    expect(mockPersistence.persistWorldStore).not.toHaveBeenCalled();
  });

  test('clears currentWorldId if deleted world was current', () => {
    // Set the test world as current
    worldStore.setState({ currentWorldId: testWorld.id });
    expect(worldStore.getState().currentWorldId).toBe(testWorld.id);

    // Delete the current world
    worldStore.getState().deleteWorld(testWorld.id);

    // Verify currentWorldId is cleared
    expect(worldStore.getState().currentWorldId).toBeNull();
  });

  test('does not affect currentWorldId if different world is deleted', () => {
    const anotherWorld: World = {
      ...testWorld,
      id: generateId(),
      name: 'Another World',
    };

    // Add another world and set it as current
    worldStore.setState({
      worlds: {
        [testWorld.id]: testWorld,
        [anotherWorld.id]: anotherWorld,
      },
      currentWorldId: anotherWorld.id,
    });

    // Delete the first world (not current)
    worldStore.getState().deleteWorld(testWorld.id);

    // Verify currentWorldId unchanged
    expect(worldStore.getState().currentWorldId).toBe(anotherWorld.id);
    expect(worldStore.getState().worlds[anotherWorld.id]).toBeDefined();
  });

  test('handles errors during persistence gracefully', () => {
    // Mock persistence to throw error
    mockPersistence.persistWorldStore.mockImplementation(() => {
      throw new Error('Persistence failed');
    });

    // Delete should still work even if persistence fails
    worldStore.getState().deleteWorld(testWorld.id);

    // World should still be deleted from state
    expect(worldStore.getState().worlds[testWorld.id]).toBeUndefined();
    expect(mockPersistence.persistWorldStore).toHaveBeenCalledTimes(1);
  });
});