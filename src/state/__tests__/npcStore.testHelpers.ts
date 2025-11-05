/**
 * Test helpers for npcStore tests
 * Provides reusable NPC data factories
 */

/**
 * Creates basic NPC test data
 */
export function createTestNPCData(overrides?: Partial<{
  worldId: string;
  name: string;
  description: string;
  avatarUrl?: string;
}>) {
  return {
    worldId: 'world-123',
    name: 'Test NPC',
    description: 'A test NPC for testing',
    ...overrides
  };
}

/**
 * Resets the NPC store to initial state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetNPCStore(useNPCStore: any) {
  useNPCStore.setState({
    npcs: {},
    entities: {},
    worldNpcs: {},
    currentEntityId: null,
    error: null,
    loading: false,
  });
}
