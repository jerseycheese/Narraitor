import { UserFriendlyError } from '@/lib/utils/errorUtils';
import {
  InventoryItem,
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
  ItemUsageResult,
  ItemEquipResult,
} from '@/types/inventory.types';
import { EntityID, GeneratedImage } from '../types/common.types';
import { CrudStore } from './crudStore.types';

/**
 * Inventory store interface with state and actions.
 *
 * Lives in its own module (rather than inventoryStore.ts) so the action
 * factories in inventoryStore.{actions,characterInventory,equipment}.ts can
 * type against it without importing the store module — which would form an
 * import cycle.
 */
export interface InventoryStore extends CrudStore<InventoryItem> {
  items: Record<EntityID, InventoryItem>;
  characterInventories: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;
  generatingImageFor: Set<EntityID>; // Track items with images being generated
  imageGenerationErrors: Map<EntityID, string>; // Track generation errors by item ID

  // Core CRUD operations
  createItem: (itemData: InventoryItemCreatePayload) => EntityID;
  updateItem: (itemId: EntityID, updates: Partial<InventoryItem>) => void;
  deleteItem: (itemId: EntityID) => void;

  // Inventory-specific operations
  addItem: (
    characterId: EntityID,
    itemData: InventoryItemAddPayload
  ) => EntityID;
  removeItem: (
    characterId: EntityID,
    itemId: EntityID,
    quantity?: number
  ) => void;
  updateItemQuantity: (itemId: EntityID, quantity: number) => void;
  getCharacterItems: (characterId: EntityID) => InventoryItem[];
  clearCharacterInventory: (characterId: EntityID) => void;
  useItem: (characterId: EntityID, itemId: EntityID) => ItemUsageResult;
  toggleEquipItem: (
    characterId: EntityID,
    itemId: EntityID
  ) => ItemEquipResult;

  // Image generation tracking
  setGeneratingImage: (itemId: EntityID, isGenerating: boolean) => void;
  setImageGenerationError: (itemId: EntityID, error: string | null) => void;

  // State management
  reset: () => void;
  setError: (error: UserFriendlyError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface InventoryItemCreatePayload {
  name: string;
  description?: string;
  quantity?: number;
  stackable: boolean;
  maxStack?: number;
  categorization: InventoryItemCategorization;
  acquisition: InventoryAcquisitionRecord;
  image?: GeneratedImage; // Optional AI-generated visual asset
}

export type InventoryItemAddPayload = Omit<
  InventoryItemCreatePayload,
  'categorization'
> & {
  categorization?: InventoryItemCategorization;
};

/** Shared set/get shapes for the inventoryStore action factories. */
export type InventoryStoreSet = (
  partial:
    | Partial<InventoryStore>
    | ((state: InventoryStore) => Partial<InventoryStore>)
) => void;
export type InventoryStoreGet = () => InventoryStore;
