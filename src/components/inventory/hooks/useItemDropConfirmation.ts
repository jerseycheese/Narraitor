'use client';

import { useState } from 'react';
import { useInventoryStore } from '@/state/inventoryStore';
import { InventoryItem } from '@/types/inventory.types';
import { EntityID } from '@/types/common.types';

export interface UseItemDropConfirmationReturn {
  // Dialog state
  isDialogOpen: boolean;
  itemToDrop: InventoryItem | null;
  dropQuantity: number;
  quantityError: string | null;
  storeError: { title: string; message: string } | null;

  // Actions
  openDropDialog: (item: InventoryItem) => void;
  closeDropDialog: () => void;
  setDropQuantity: (quantity: number) => void;
  confirmDrop: () => void;
}

export const useItemDropConfirmation = (characterId: EntityID): UseItemDropConfirmationReturn => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToDrop, setItemToDrop] = useState<InventoryItem | null>(null);
  const [dropQuantity, setDropQuantityState] = useState(1);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<{ title: string; message: string } | null>(null);

  const clearError = useInventoryStore((state) => state.clearError);

  const openDropDialog = (item: InventoryItem) => {
    setItemToDrop(item);
    setDropQuantityState(item.quantity); // Default to dropping all
    setQuantityError(null);
    setStoreError(null);
    setIsDialogOpen(true);
    clearError(); // Clear any previous global store errors
  };

  const closeDropDialog = () => {
    setIsDialogOpen(false);
    setItemToDrop(null);
    setDropQuantityState(1);
    setQuantityError(null);
    setStoreError(null);
    clearError();
  };

  const setDropQuantity = (quantity: number) => {
    if (!itemToDrop) return;

    if (quantity < 1) {
      setQuantityError('Quantity must be at least 1');
    } else if (quantity > itemToDrop.quantity) {
      setQuantityError(`Cannot drop more than ${itemToDrop.quantity} items`);
    } else {
      setQuantityError(null);
    }
    setDropQuantityState(quantity);
  };

  const confirmDrop = () => {
    if (!itemToDrop) return;
    if (quantityError) return; // Prevent action if validation failed

    // Get removeItem directly from state to ensure we have the latest function
    const removeItem = useInventoryStore.getState().removeItem;
    
    removeItem(characterId, itemToDrop.id, dropQuantity);

    // Check if removeItem set an error in the store
    const currentError = useInventoryStore.getState().error;
    
    if (currentError) {
      // Keep dialog open, display error
      setStoreError({
        title: currentError.title,
        message: currentError.message,
      });
      return;
    }

    // Success - close dialog
    closeDropDialog();
  };

  return {
    isDialogOpen,
    itemToDrop,
    dropQuantity,
    quantityError,
    storeError,
    openDropDialog,
    closeDropDialog,
    setDropQuantity,
    confirmDrop,
  };
};
