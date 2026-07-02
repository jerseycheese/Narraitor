/**
 * World-deletion cascade through the real event wiring.
 *
 * characterStore and inventoryStore already cascade on deletion; these tests
 * cover the stores that previously leaked orphaned data into IndexedDB when a
 * world was deleted: npcStore, goalStore, and loreStore. Also pins loreStore's
 * migrate() to the sibling contract (preserve data, only clear if null) —
 * it used to wipe all persisted lore on every version bump.
 */
import '@/state/storeEventWiring';
import { useNPCStore } from '@/state/npcStore';
import { useGoalStore } from '@/state/goalStore';
import { useLoreStore } from '@/state/loreStore';
import { storeEvents, StoreEventTypes } from '@/lib/state/storePubSub';
import type { NPC } from '@/types/npc.types';
import type { NarrativeGoal } from '@/types/goal.types';

const seedNPC = (npcId: string, worldId: string): void => {
  const npc = { id: npcId, worldId, name: `NPC ${npcId}` } as unknown as NPC;
  useNPCStore.setState((state) => ({
    npcs: { ...state.npcs, [npcId]: npc },
    entities: { ...state.entities, [npcId]: npc },
    worldNpcs: {
      ...state.worldNpcs,
      [worldId]: [...(state.worldNpcs[worldId] ?? []), npcId],
    },
  }));
};

const seedGoal = (goalId: string, worldId: string | undefined, sessionId: string): void => {
  const goal = {
    id: goalId,
    worldId,
    sessionId,
    title: `Goal ${goalId}`,
    description: 'Seeded goal',
    status: 'active',
  } as unknown as NarrativeGoal;
  useGoalStore.setState((state) => ({
    goals: { ...state.goals, [goalId]: goal },
    entities: { ...state.entities, [goalId]: goal },
    sessionGoals: {
      ...state.sessionGoals,
      [sessionId]: [...(state.sessionGoals[sessionId] ?? []), goalId],
    },
  }));
};

const seedLoreFact = (factId: string, worldId: string): void => {
  const fact = { id: factId, worldId, key: `key-${factId}`, value: 'Seeded fact' };
  useLoreStore.setState((state) => ({
    facts: { ...state.facts, [factId]: fact },
    entities: { ...state.entities, [factId]: fact },
  }) as never);
};

describe('WORLD_DELETED cascade', () => {
  beforeEach(() => {
    useNPCStore.setState({ npcs: {}, entities: {}, worldNpcs: {} });
    useGoalStore.setState({ goals: {}, entities: {}, sessionGoals: {}, activeGoalIds: [] });
    useLoreStore.setState({ facts: {}, entities: {}, factHistory: {} } as never);
  });

  it('clears the deleted world\'s NPCs, goals, and lore facts', async () => {
    seedNPC('npc-1', 'world-1');
    seedGoal('goal-1', 'world-1', 'session-1');
    seedLoreFact('fact-1', 'world-1');

    await storeEvents.emit(StoreEventTypes.WORLD_DELETED, { worldId: 'world-1' });

    expect(useNPCStore.getState().npcs['npc-1']).toBeUndefined();
    expect(useGoalStore.getState().goals['goal-1']).toBeUndefined();
    expect(useLoreStore.getState().facts['fact-1']).toBeUndefined();
  });

  it('preserves other worlds\' data and unattributed goals', async () => {
    seedNPC('npc-2', 'world-2');
    seedGoal('goal-2', 'world-2', 'session-2');
    seedGoal('goal-no-world', undefined, 'session-2');
    seedLoreFact('fact-2', 'world-2');

    await storeEvents.emit(StoreEventTypes.WORLD_DELETED, { worldId: 'world-1' });

    expect(useNPCStore.getState().npcs['npc-2']).toBeDefined();
    expect(useGoalStore.getState().goals['goal-2']).toBeDefined();
    expect(useGoalStore.getState().goals['goal-no-world']).toBeDefined();
    expect(useLoreStore.getState().facts['fact-2']).toBeDefined();
  });
});

describe('loreStore migrate contract', () => {
  const getMigrate = () =>
    (useLoreStore as unknown as {
      persist: { getOptions: () => { migrate?: (state: unknown, version: number) => unknown } };
    }).persist.getOptions().migrate;

  it('preserves persisted state across a version bump', () => {
    const persisted = { facts: { 'fact-1': { id: 'fact-1' } }, factHistory: {}, mergeAuditLog: [] };
    expect(getMigrate()?.(persisted, 2)).toBe(persisted);
  });

  it('falls back to initial state only when nothing was persisted', () => {
    const migrated = getMigrate()?.(null, 2) as { facts: Record<string, unknown> };
    expect(migrated.facts).toEqual({});
  });
});
