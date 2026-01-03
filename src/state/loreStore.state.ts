import type {
  LoreFact,
  LoreMergeAuditEntry,
  LoreUsageEvent,
  LoreUsageStats,
} from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import type { UserFriendlyError } from '@/lib/utils/errorUtils';

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
