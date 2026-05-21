import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useInventoryStore } from '@/state/inventoryStore';

export type JournalStore = ReturnType<typeof useJournalStore>;
export type NarrativeStore = ReturnType<typeof useNarrativeStore>;
export type InventoryStore = ReturnType<typeof useInventoryStore>;
