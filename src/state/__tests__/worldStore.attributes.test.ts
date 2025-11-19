/**
 * Tests for worldStore attribute management
 * Covers adding, updating, and removing attributes
 */

import { useWorldStore } from '../worldStore';
import { createTestWorldData, createTestAttributeData } from './worldStore.testHelpers';

describe('useWorldStore - Attribute Management', () => {
  let worldId: string;

  beforeEach(() => {
    useWorldStore.getState().reset();
    worldId = useWorldStore.getState().createWorld(createTestWorldData({
      name: 'Attribute Test World',
      description: 'World for attribute tests',
    }));
  });

  test('should enforce max attributes limit', () => {
    const world = useWorldStore.getState().worlds[worldId];
    world.settings.maxAttributes = 2;

    // Add two attributes (should succeed)
    useWorldStore.getState().addAttribute(worldId, createTestAttributeData({
      name: 'Strength',
    }));
    useWorldStore.getState().addAttribute(worldId, createTestAttributeData({
      name: 'Dexterity',
      description: 'Agility and dexterity attribute',
    }));

    // Third attribute should fail
    useWorldStore.getState().addAttribute(worldId, createTestAttributeData({
      name: 'Intelligence',
      description: 'Mental acuity attribute',
    }));

    const state = useWorldStore.getState();
    expect(state.worlds[worldId].attributes).toHaveLength(2);
    expect(state.error?.message).toBe('Maximum attributes limit reached');
  });
});
