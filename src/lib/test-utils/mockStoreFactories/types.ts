import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useGoalStore } from '@/state/goalStore';
import { useLoreStore } from '@/state/loreStore';

export type JournalStore = ReturnType<typeof useJournalStore>;
export type NarrativeStore = ReturnType<typeof useNarrativeStore>;
export type InventoryStore = ReturnType<typeof useInventoryStore>;
export type GoalStore = ReturnType<typeof useGoalStore>;
export type LoreStore = ReturnType<typeof useLoreStore>;
