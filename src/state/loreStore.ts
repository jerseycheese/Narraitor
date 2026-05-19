import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LoreFact,
  LoreSearchOptions,
  LoreContext,
  LoreCategory,
  LoreSource,
  StructuredLoreExtraction,
  LoreMergeAuditEntry,
  EntityMatch,
  LoreUsageEvent,
  LoreUsageSource,
  LoreUsageStats,
  DuplicateMatch,
} from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import { createIndexedDBStorage } from './persistence';
import { UserFriendlyError } from '@/lib/utils/errorUtils';
import { CrudStore } from './createCrudStore';
import { createLoreFactActions } from './loreStore.facts';
import { createLoreAliasActions } from './loreStore.aliases';
import { createLoreImportExportActions } from './loreStore.import-export';
import { createLoreUsageActions } from './loreStore.usage';
import { createLoreDeduplicationActions } from './loreStore.deduplication';

export interface FactHistory {
  factId: EntityID;
  versions: LoreFact[];
}

export const getInitialState = () => ({
  facts: {} as Record<EntityID, LoreFact>,
  entities: {} as Record<EntityID, LoreFact>,
  factHistory: {} as Record<EntityID, FactHistory>,
  mergeAuditLog: [] as LoreMergeAuditEntry[],
  loreUsage: {} as Record<EntityID, LoreUsageStats>,
  loreUsageEvents: [] as LoreUsageEvent[],
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

export interface LoreStore extends CrudStore<LoreFact> {
  facts: Record<EntityID, LoreFact>;
  factHistory: Record<EntityID, FactHistory>;
  mergeAuditLog: LoreMergeAuditEntry[];
  loreUsage: Record<EntityID, LoreUsageStats>;
  loreUsageEvents: LoreUsageEvent[];
  error: UserFriendlyError | null;
  loading: boolean;

  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata'],
    visibility?: 'session-private' | 'world-shared'
  ) => EntityID;
  getFacts: (options?: LoreSearchOptions) => LoreFact[];
  clearFacts: (worldId: EntityID) => void;
  cleanupOldFacts: (worldId: EntityID, keepRecentCount?: number) => void;
  compactFactHistory: (maxVersionsPerFact?: number) => void;
  getFactsCount: (worldId?: EntityID) => number;
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  validateFactUniqueness: (worldId: EntityID, key: string, value: string) => boolean;
  findSimilarFacts: (worldId: EntityID, value: string) => LoreFact[];
  searchFacts: (query: string, options?: LoreSearchOptions) => LoreFact[];
  exportFacts: (worldId: EntityID) => string;
  importFacts: (worldId: EntityID, jsonData: string) => void;
  getFactHistory: (id: EntityID) => LoreFact[];
  validateFact: (
    fact: Partial<{ key: string; value: string; category: LoreCategory; worldId: EntityID }>
  ) => boolean;
  validateKey: (key: string) => boolean;
  getLoreContext: (worldId: EntityID, sessionId?: EntityID, limit?: number) => LoreContext;
  addStructuredLore: (extraction: StructuredLoreExtraction, worldId: EntityID, sessionId?: EntityID) => void;
  addAlias: (id: EntityID, alias: string) => void;
  removeAlias: (id: EntityID, alias: string) => void;
  setAliases: (id: EntityID, aliases: string[]) => void;
  findEntityByAnyName: (name: string, worldId: EntityID) => LoreFact | null;
  scanForDuplicates: (worldId: EntityID, category?: LoreCategory) => Promise<DuplicateMatch[]>;
  mergeFacts: (primaryId: EntityID, secondaryId: EntityID) => void;
  checkDuplicateBeforeCreate: (
    value: string,
    category: LoreCategory,
    worldId: EntityID
  ) => Promise<DuplicateMatch[]>;
  findPotentialEntityMatches: (
    worldId: EntityID,
    options?: { minConfidence?: number; category?: LoreCategory }
  ) => EntityMatch[];
  getMergeAuditLog: () => LoreMergeAuditEntry[];
  recordLoreUsage: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    source?: LoreUsageSource;
  }) => void;
  recordLoreMentions: (input: {
    worldId: EntityID;
    sessionId?: EntityID;
    factIds: EntityID[];
    responseText: string;
    source?: LoreUsageSource;
  }) => void;
  clearLoreUsage: (worldId?: EntityID) => void;
  reset: () => void;
}

export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      ...createLoreFactActions(set, get),
      ...createLoreAliasActions(set, get),
      ...createLoreImportExportActions(set, get),
      ...createLoreUsageActions(set, get),
      ...createLoreDeduplicationActions(set, get),
      getMergeAuditLog: () => get().mergeAuditLog,
      reset: () => set(getInitialState()),
    }),
    {
      name: 'lore-store',
      storage: createIndexedDBStorage(),
      version: 3,
      partialize: (state) => ({
        facts: state.facts,
        factHistory: state.factHistory,
        mergeAuditLog: state.mergeAuditLog,
      }),
      migrate: () => getInitialState(),
    }
  )
);
