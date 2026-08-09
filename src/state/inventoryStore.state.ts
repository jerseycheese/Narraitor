import { UserFriendlyError } from '@/lib/utils/errorUtils';
import { InventoryItem } from '@/types/inventory.types';
import { EntityID } from '../types/common.types';

// Initial state
export const getInitialState = () => ({
  items: {} as Record<EntityID, InventoryItem>,
  entities: {} as Record<EntityID, InventoryItem>,
  characterInventories: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
  generatingImageFor: new Set<EntityID>(),
  imageGenerationErrors: new Map<EntityID, string>(),
});
