import type { Decision, NarrativeSegment } from '@/types/narrative.types';

type InventoryStoreState = {
  items: Record<string, unknown>;
  entities?: Record<string, unknown>;
  characterInventories: Record<string, string[]>;
};

declare global {
  interface Window {
    __PLAYWRIGHT__?: boolean;
    __TEST_WORLDS__?: Record<string, unknown>;
    __TEST_CHARACTERS__?: Record<string, unknown>;
    __TEST_SESSIONS__?: Record<string, unknown>;
    __TEST_CURRENT_WORLD_ID__?: string | null;
    __TEST_DECISIONS__?: Record<string, Decision>;
    __TEST_SEGMENTS__?: Record<string, NarrativeSegment>;
    __TEST_SESSION_SEGMENTS__?: Record<string, string[]>;
    __TEST_SESSION_DECISIONS__?: Record<string, string[]>;
    __TEST_SEEDED__?: boolean;
    useInventoryStore?: {
      setState: (
        partial: InventoryStoreState | ((state: InventoryStoreState) => InventoryStoreState),
        replace?: boolean
      ) => void;
      getState?: () => InventoryStoreState;
    };
  }
}

export {};
