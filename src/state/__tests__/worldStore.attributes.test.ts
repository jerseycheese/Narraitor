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

  test('should add attribute to world', () => {
    const attributeData = createTestAttributeData({
      category: 'Physical'
    });

    useWorldStore.getState().addAttribute(worldId, attributeData);
    const state = useWorldStore.getState();
    const world = state.worlds[worldId];

    expect(world.attributes).toHaveLength(1);
    expect(world.attributes[0].name).toBe('Strength');
    expect(world.attributes[0].worldId).toBe(worldId);
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

  test('should update attribute', () => {
    useWorldStore.getState().addAttribute(worldId, createTestAttributeData());

    const state = useWorldStore.getState();
    const attributeId = state.worlds[worldId].attributes[0].id;

    useWorldStore.getState().updateAttribute(worldId, attributeId, {
      name: 'Power',
      baseValue: 12
    });

    const updatedState = useWorldStore.getState();
    const attribute = updatedState.worlds[worldId].attributes[0];
    expect(attribute.name).toBe('Power');
    expect(attribute.baseValue).toBe(12);
  });

  test('should remove attribute', () => {
    useWorldStore.getState().addAttribute(worldId, createTestAttributeData());

    const state = useWorldStore.getState();
    const attributeId = state.worlds[worldId].attributes[0].id;

    useWorldStore.getState().removeAttribute(worldId, attributeId);

    const updatedState = useWorldStore.getState();
    expect(updatedState.worlds[worldId].attributes).toHaveLength(0);
  });
});
