'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Shield } from 'lucide-react';
import { useInventoryStore } from '@/state/inventoryStore';
import { useSessionStore } from '@/state/sessionStore';
import { EntityID } from '@/types/common.types';
import { InventoryItem } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import {
  getCategoryMetadata,
  STANDARD_CATEGORIES,
} from '@/lib/inventory/categories';
import { isEquippableCategory } from '@/lib/inventory/equippable';
import type { StandardInventoryCategory } from '@/types/inventory.types';
import { processItemUsage } from '@/lib/inventory/itemUsageService';
import { useItemDropConfirmation } from './hooks/useItemDropConfirmation';
import { DropConfirmationDialog } from './DropConfirmationDialog';

interface InventoryListProps {
  characterId: EntityID;
  className?: string;
}

interface InventoryItemImageProps {
  item: InventoryItem;
  isGenerating: boolean;
  error?: string;
}

/**
 * Renders the visual slot for an inventory item.
 *
 * Priority:
 * - an in-flight generation shows a loading affordance;
 * - a completed image with a renderable URL (AI-generated or placeholder)
 *   renders as an <img>;
 * - a recorded generation error surfaces the message from
 *   inventoryStore.imageGenerationErrors;
 * - an image object that resolved to no URL (GeneratedImage.url is
 *   `string | null`) falls back to an "image unavailable" affordance rather
 *   than an empty slot.
 * Items with nothing to show (no image, not generating, no error) render no
 * slot to keep manually-added items clean.
 */
const InventoryItemImage: React.FC<InventoryItemImageProps> = ({
  item,
  isGenerating,
  error,
}) => {
  const imageUrl = item.image?.url ?? null;

  if (isGenerating) {
    return (
      <div className="manuscript-inventory-item-image-wrapper">
        <div
          className="manuscript-inventory-item-image-placeholder manuscript-skeleton-pulse"
          role="img"
          aria-label={`Generating image for ${item.name}`}
        />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="manuscript-inventory-item-image-wrapper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={item.name}
          className="manuscript-inventory-item-image"
          loading="lazy"
        />
      </div>
    );
  }

  // Either a recorded error, or an image object that resolved to a null URL,
  // yields an "image unavailable" affordance. The error variant carries the
  // failure message as a tooltip; a null-URL image is a benign miss.
  if (error || item.image) {
    return (
      <div className="manuscript-inventory-item-image-wrapper">
        <div
          className="manuscript-inventory-item-image-placeholder manuscript-inventory-item-image-placeholder-error"
          role="img"
          aria-label={`Image unavailable for ${item.name}`}
          title={error}
        >
          No image
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Responsive inventory list component with categorized item display.
 * Displays items grouped by category with responsive grid layout.
 *
 * Acceptance Criteria:
 * - Displays items in a clear, organized list
 * - Items grouped by categories with visual separation
 * - Shows essential information (name, description, quantity, category)
 * - Responsive grid: 1 column (mobile) → 2 (tablet) → 3 (desktop)
 * - Automatically updates when inventory changes (via Zustand subscription)
 */
export const InventoryList: React.FC<InventoryListProps> = ({
  characterId,
  className = '',
}) => {
  // Select items and character inventory to re-render on changes
  const itemsObject = useInventoryStore((state) => state.items);
  const characterInventories = useInventoryStore(
    (state) => state.characterInventories
  );
  // Image generation lifecycle state, surfaced per item in the card image slot
  const generatingImageFor = useInventoryStore(
    (state) => state.generatingImageFor
  );
  const imageGenerationErrors = useInventoryStore(
    (state) => state.imageGenerationErrors
  );

  const {
    isDialogOpen,
    itemToDrop,
    dropQuantity,
    quantityError,
    storeError,
    openDropDialog,
    closeDropDialog,
    setDropQuantity,
    confirmDrop,
  } = useItemDropConfirmation(characterId);

  // Derive character items from selected state
  const items = React.useMemo(() => {
    const itemIds = characterInventories[characterId] || [];
    return itemIds
      .map((id) => itemsObject[id])
      .filter((item): item is InventoryItem => Boolean(item));
  }, [itemsObject, characterInventories, characterId]);
  const sessionId = useSessionStore((state) => state.id);
  const toggleEquipItem = useInventoryStore((state) => state.toggleEquipItem);
  const [usingItemId, setUsingItemId] = useState<EntityID | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Equip or unequip an item; surface the block message if the store rejects it
  const handleToggleEquip = (item: InventoryItem) => {
    setErrorFeedback(null);
    const result = toggleEquipItem(characterId, item.id);
    if (!result.success && result.error) {
      setErrorFeedback(result.error.message);
    }
  };

  // Handle item usage
  const handleUseItem = async (itemId: EntityID) => {
    setUsingItemId(itemId);
    setErrorFeedback(null);

    try {
      const result = await processItemUsage(
        characterId,
        itemId,
        sessionId || undefined
      );

      if (result.success) {
        // Success path handled via narrative segment entry; no inline feedback needed.
      } else {
        setErrorFeedback(result.error?.message || 'Failed to use item');
      }
    } catch {
      setErrorFeedback("Couldn't use that item. Try again.");
    } finally {
      setUsingItemId(null);
    }
  };

  // Group items by category
  const itemsByCategory = items.reduce(
    (acc, item) => {
      const category = item.categoryId as StandardInventoryCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<StandardInventoryCategory, InventoryItem[]>
  );

  // Get categories that have items (in canonical order from STANDARD_CATEGORIES)
  const populatedCategories = STANDARD_CATEGORIES.filter(
    (category) => itemsByCategory[category]?.length > 0
  );

  // Empty state when no items
  if (items.length === 0) {
    return (
      <div className={clsx('component-inventory-list', className)}>
        <EmptyState
          title="No items in inventory"
          description="Items will appear here as they are added"
        />
      </div>
    );
  }

  return (
    <div
      className={clsx('component-inventory-list', className)}
      role="region"
      aria-label="Character inventory"
    >
      {/* Feedback message */}
      {errorFeedback && (
        <Alert variant="destructive" className="manuscript-inventory-error">
          <AlertDescription>{errorFeedback}</AlertDescription>
        </Alert>
      )}

      {/* Grid View - Aligned with Manuscript Design */}
      <div className="inventory-category-list">
        {populatedCategories.map((categoryId) => {
          const categoryItems = itemsByCategory[categoryId];
          const metadata = getCategoryMetadata(categoryId);
          const categoryName = metadata?.name || categoryId;

          return (
            <section
              key={categoryId}
              className="manuscript-inventory-category-group"
              aria-labelledby={`category-${categoryId}`}
            >
              <h3 id={`category-${categoryId}`} className="manuscript-inventory-category-title">
                {categoryName}
              </h3>

              <div className="manuscript-inventory-grid" role="list" aria-label={`${categoryName} items`}>
                {categoryItems.map((item) => (
                  <article
                    key={item.id}
                    className={clsx(
                      'manuscript-inventory-item',
                      item.equipped && 'is-equipped'
                    )}
                    data-equipped={item.equipped ? 'true' : undefined}
                    role="listitem"
                  >
                    <InventoryItemImage
                      item={item}
                      isGenerating={generatingImageFor.has(item.id)}
                      error={imageGenerationErrors.get(item.id)}
                    />

                    <div className="manuscript-inventory-item-header">
                      <h4 className="manuscript-inventory-item-name">{item.name}</h4>
                      {item.stackable && (
                        <span
                          className="manuscript-inventory-item-quantity"
                          aria-label={`Quantity: ${item.quantity}`}
                        >
                          ×{item.quantity}
                        </span>
                      )}
                    </div>

                    {item.equipped && (
                      <span className="manuscript-inventory-item-equipped-badge">
                        <Shield aria-hidden="true" />
                        Equipped
                      </span>
                    )}

                    {item.description && (
                      <p className="manuscript-inventory-item-description">{item.description}</p>
                    )}

                    <div className="manuscript-inventory-item-footer">
                      <div className="manuscript-inventory-actions">
                        {isEquippableCategory(item.categoryId) && (
                          <Button
                            className="manuscript-inventory-action-button"
                            variant={item.equipped ? 'secondary' : 'outline'}
                            onClick={() => handleToggleEquip(item)}
                            aria-pressed={item.equipped ?? false}
                            aria-label={
                              item.equipped
                                ? `Unequip ${item.name}`
                                : `Equip ${item.name}`
                            }
                          >
                            {item.equipped ? 'UNEQUIP' : 'EQUIP'}
                          </Button>
                        )}
                        <Button
                          className="manuscript-inventory-action-button"
                          variant="outline"
                          onClick={() => handleUseItem(item.id)}
                          disabled={
                            usingItemId === item.id || item.quantity <= 0
                          }
                        >
                          {usingItemId === item.id ? 'USING...' : 'USE'}
                        </Button>
                        <Button
                          className="manuscript-inventory-action-button"
                          variant="ghost"
                          onClick={() => openDropDialog(item)}
                          aria-label={`Drop ${item.name}`}
                        >
                          DROP
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <DropConfirmationDialog
        isOpen={isDialogOpen}
        onClose={closeDropDialog}
        onConfirm={confirmDrop}
        item={itemToDrop}
        quantity={dropQuantity}
        onQuantityChange={setDropQuantity}
        quantityError={quantityError}
        storeError={storeError}
      />
    </div>
  );
};
