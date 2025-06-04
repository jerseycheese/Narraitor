// Unmock the worldStore module for this test
jest.unmock('../worldStore');

import { worldStore } from '../worldStore';

describe('worldStore - deleteWorld integration', () => {
  beforeEach(() => {
    // Reset the actual store
    worldStore.getState().reset();
  });

  test('should delete an existing world', () => {
    // Create a test world
    const worldData = {
      name: 'Test World',
      description: 'A world to test deletion',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20,
      },
    };

    // Create the world
    const worldId = worldStore.getState().createWorld(worldData);
    expect(Object.keys(worldStore.getState().worlds).length).toBe(1);

    // Delete the world
    worldStore.getState().deleteWorld(worldId);

    // Verify world is removed
    const state = worldStore.getState();
    expect(state.worlds[worldId]).toBeUndefined();
    expect(Object.keys(state.worlds).length).toBe(0);
  });

  test('should do nothing when trying to delete non-existent world', () => {
    const nonExistentId = 'non-existent-id';
    const initialState = worldStore.getState();

    // Attempt to delete non-existent world
    worldStore.getState().deleteWorld(nonExistentId);

    // Verify nothing changed
    const newState = worldStore.getState();
    expect(newState).toEqual(initialState);
  });

  test('should clear currentWorldId if deleted world was current', () => {
    // Create a test world
    const worldData = {
      name: 'Test World',
      description: 'A world to test deletion',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20,
      },
    };

    // Create and set as current
    const worldId = worldStore.getState().createWorld(worldData);
    worldStore.getState().setCurrentWorld(worldId);
    expect(worldStore.getState().currentWorldId).toBe(worldId);

    // Delete the current world
    worldStore.getState().deleteWorld(worldId);

    // Verify currentWorldId is cleared
    expect(worldStore.getState().currentWorldId).toBeNull();
  });

  test('should not affect currentWorldId if different world is deleted', () => {
    // Create two worlds
    const worldData1 = {
      name: 'World 1',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20,
      },
    };

    const worldData2 = {
      name: 'World 2',
      theme: 'Sci-Fi',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20,
      },
    };

    // Create both worlds
    const worldId1 = worldStore.getState().createWorld(worldData1);
    const worldId2 = worldStore.getState().createWorld(worldData2);

    // Set world2 as current
    worldStore.getState().setCurrentWorld(worldId2);
    expect(worldStore.getState().currentWorldId).toBe(worldId2);

    // Delete world1 (not current)
    worldStore.getState().deleteWorld(worldId1);

    // Verify currentWorldId unchanged
    expect(worldStore.getState().currentWorldId).toBe(worldId2);
    expect(worldStore.getState().worlds[worldId2]).toBeDefined();
    expect(worldStore.getState().worlds[worldId1]).toBeUndefined();
  });
});
