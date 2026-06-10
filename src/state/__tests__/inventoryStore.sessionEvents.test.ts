/**
 * inventoryStore's SESSION_FRESH_START subscription: a forced-fresh session
 * clears the character's inventory (post-hydration), an unforced one doesn't.
 */
import { useInventoryStore } from '../inventoryStore';
import { storeEvents, StoreEventTypes, type SessionFreshStartEvent } from '@/lib/state/storePubSub';
import type { InventoryItem } from '@/types/inventory.types';

const seedItem = (characterId: string, itemId: string) => {
  const item = {
    id: itemId,
    name: 'Seeded Sword',
    quantity: 1,
    stackable: false,
  } as unknown as InventoryItem;

  useInventoryStore.setState((state) => ({
    items: { ...state.items, [itemId]: item },
    entities: { ...state.entities, [itemId]: item },
    characterInventories: {
      ...state.characterInventories,
      [characterId]: [...(state.characterInventories[characterId] ?? []), itemId],
    },
  }));
};

const emitFreshStart = (isForcedFresh: boolean) =>
  storeEvents.emit<SessionFreshStartEvent>(StoreEventTypes.SESSION_FRESH_START, {
    sessionId: 'session-a',
    worldId: 'world-1',
    characterId: 'char-1',
    isNewSession: true,
    isForcedFresh,
  });

const ensureHydrated = async () => {
  const persistApi = (useInventoryStore as unknown as {
    persist?: {
      hasHydrated?: () => boolean;
      onFinishHydration?: (callback: () => void) => () => void;
      rehydrate?: () => Promise<void> | void;
    };
  }).persist;

  if (persistApi?.hasHydrated?.()) return;
  await new Promise<void>((resolve) => {
    persistApi?.onFinishHydration?.(() => resolve());
    void persistApi?.rehydrate?.();
  });
};

describe('inventoryStore SESSION_FRESH_START subscription', () => {
  beforeEach(async () => {
    await ensureHydrated();
    useInventoryStore.setState({ items: {}, entities: {}, characterInventories: {} });
  });

  it('clears the character inventory on a forced-fresh session', async () => {
    seedItem('char-1', 'item-1');

    await emitFreshStart(true);

    expect(useInventoryStore.getState().getCharacterItems('char-1')).toHaveLength(0);
  });

  it('keeps the inventory when the session is not forced fresh', async () => {
    seedItem('char-1', 'item-1');

    await emitFreshStart(false);

    expect(useInventoryStore.getState().getCharacterItems('char-1')).toHaveLength(1);
  });
});
