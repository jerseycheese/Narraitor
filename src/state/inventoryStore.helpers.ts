import { normalizeText, NORM_NAME } from '@/lib/utils';
import { logInventoryGuardSanitized } from '@/lib/inventory/inventoryTelemetry';
import { InventoryItem } from '@/types/inventory.types';
import { EntityID } from '../types/common.types';
import { isValidCategory } from '@/lib/inventory/categories';
import { createAcquisitionJournalEntry } from '@/lib/inventory/journalIntegration';
import type {
  InventoryItemCreatePayload,
  InventoryStoreSet,
  InventoryStoreGet,
} from './inventoryStore.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('InventoryStore');

export const sanitizeInventoryValue = (
  characterId: EntityID,
  value: unknown
): {
  ids: EntityID[];
  shouldPatch: boolean;
  shouldDelete: boolean;
} => {
  if (value === undefined) {
    return {
      ids: [],
      shouldPatch: false,
      shouldDelete: false,
    };
  }

  if (!Array.isArray(value)) {
    logInventoryGuardSanitized({
      characterId,
      reason: 'non-array',
      removedCount: 0,
    });
    return {
      ids: [],
      shouldPatch: true,
      shouldDelete: true,
    };
  }

  const filtered = value.filter(
    (id): id is EntityID => typeof id === 'string' && id.length > 0
  );
  const removedCount = value.length - filtered.length;

  if (removedCount > 0) {
    logInventoryGuardSanitized({
      characterId,
      reason: 'invalid-entries',
      removedCount,
    });
  }

  return {
    ids: filtered,
    shouldPatch: removedCount > 0,
    shouldDelete: false,
  };
};

export const validateNewItemData = (data: InventoryItemCreatePayload): void => {
  const normalizedName = normalizeText(data.name || '', NORM_NAME);
  if (!normalizedName) {
    throw new Error('Item name is required');
  }

  const quantity = data.quantity ?? data.acquisition.quantity ?? 1;
  if (quantity <= 0) {
    throw new Error('Item quantity must be greater than zero');
  }

  if (!data.stackable && quantity > 1) {
    throw new Error(
      'Non-stackable items cannot have quantity greater than one'
    );
  }

  if (!data.categorization) {
    throw new Error('Categorization metadata is required');
  }

  if (!isValidCategory(data.categorization.categoryId)) {
    throw new Error(
      'Categorization must resolve to a standard inventory category'
    );
  }

  if (!data.acquisition) {
    throw new Error('Acquisition metadata is required');
  }

  const acquisitionQuantity = data.acquisition.quantity ?? quantity;
  if (acquisitionQuantity <= 0) {
    throw new Error('Acquisition quantity must be greater than zero');
  }

  if (data.maxStack !== undefined && data.maxStack <= 0) {
    throw new Error('Max stack size must be greater than zero');
  }

  // Validate optional image field if present
  if (data.image !== undefined) {
    if (typeof data.image !== 'object' || data.image === null) {
      throw new Error('Image must be a GeneratedImage object');
    }
    if (!data.image.type || (data.image.type !== 'ai-generated' && data.image.type !== 'placeholder')) {
      throw new Error('Image type must be "ai-generated" or "placeholder"');
    }
    if (data.image.url !== null && typeof data.image.url !== 'string') {
      throw new Error('Image URL must be a string or null');
    }
  }
};

/**
 * Creates a journal entry for an item acquisition.
 * Requires sessionId to be present in the acquisition record.
 * Gets worldId from the session store.
 */
export const createJournalEntryForAcquisition = async (
  item: InventoryItem,
  sessionId: EntityID,
  characterId: EntityID
): Promise<void> => {
  try {
    // Dynamically import stores to avoid circular dependencies
    const { useJournalStore } = await import('./journalStore');
    const { useSessionStore } = await import('./sessionStore');

    const sessionStore = useSessionStore.getState();
    const journalStore = useJournalStore.getState();

    // Get worldId from session store
    const worldId = sessionStore.worldId;

    if (!worldId) {
      // No worldId available - skip journal entry creation
      return;
    }

    // Create journal entry using the helper
    const journalEntry = createAcquisitionJournalEntry(
      item,
      worldId,
      characterId
    );

    // Add entry to journal store
    journalStore.addEntry(sessionId, journalEntry);
  } catch (error) {
    // Silently fail journal entry creation - don't block inventory operations
    logger.warn('Failed to create journal entry for item acquisition:', error);
  }
};

/**
 * Builds the ensureCharacterInventory closure shared by the
 * characterInventory and equipment action factories: reads a character's
 * item-id list, sanitizing (and persisting the sanitized form) if the
 * persisted value is malformed.
 */
export const createEnsureCharacterInventory = (
  set: InventoryStoreSet,
  get: InventoryStoreGet
) => {
  return (characterId: EntityID, snapshot = get()): EntityID[] => {
    const raw = snapshot.characterInventories[characterId];
    const { ids, shouldPatch, shouldDelete } = sanitizeInventoryValue(
      characterId,
      raw
    );

    if (shouldPatch) {
      set((state) => {
        const nextInventories = { ...state.characterInventories };
        if (shouldDelete) {
          delete nextInventories[characterId];
        } else {
          nextInventories[characterId] = ids;
        }
        return { characterInventories: nextInventories };
      });
    }

    if (shouldDelete) {
      return [];
    }

    return ids;
  };
};
