'use client';

import React, { useState } from 'react';
import { useInventoryStore } from '@/state/inventoryStore';
import { useSessionStore } from '@/state/sessionStore';
import { EntityID } from '@/types/common.types';
import { InventoryItem } from '@/types/inventory.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import {
  getCategoryMetadata,
  STANDARD_CATEGORIES,
} from '@/lib/inventory/categories';
import type { StandardInventoryCategory } from '@/types/inventory.types';
import { processItemUsage } from '@/lib/inventory/itemUsageService';
import {
  InventoryViewToggle,
  type InventoryViewMode,
} from './InventoryViewToggle';
import { InventoryTable } from './InventoryTable';
import { useItemDropConfirmation } from './hooks/useItemDropConfirmation';
import { DropConfirmationDialog } from './DropConfirmationDialog';

interface InventoryListProps {
  characterId: EntityID;
  className?: string;
}

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
  const [usingItemId, setUsingItemId] = useState<EntityID | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<InventoryViewMode>(() => {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventory-view-mode');
      return (saved as InventoryViewMode) || 'grid';
    }
    return 'grid';
  });

  // Persist view mode preference
  const handleViewModeChange = (mode: InventoryViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory-view-mode', mode);
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
      setErrorFeedback('An unexpected error occurred');
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
      <div className={`${className}`}>
        <EmptyState
          title="No items in inventory"
          description="Items will appear here as they are added"
          variant="centered"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className}`}
      role="region"
      aria-label="Character inventory"
    >
      {/* View Toggle */}
      <div>
        <InventoryViewToggle
          mode={viewMode}
          onModeChange={handleViewModeChange}
        />
      </div>

      {/* Feedback message */}
      {errorFeedback && (
        <Alert variant="destructive">
          <AlertDescription>{errorFeedback}</AlertDescription>
        </Alert>
      )}

      {/* Table View */}
      {viewMode === 'table' ? (
        <InventoryTable characterId={characterId} />
      ) : (
        /* Grid View */
        <>
          {populatedCategories.map((categoryId) => {
            const categoryItems = itemsByCategory[categoryId];
            const metadata = getCategoryMetadata(categoryId);
            const categoryName = metadata?.name || categoryId;
            const categoryDescription = metadata?.description;

            return (
              <section
                key={categoryId}
                className="category-group"
                aria-labelledby={`category-${categoryId}`}
              >
                {/* Category Header with visual separation */}
                <div>
                  <h3 id={`category-${categoryId}`}>{categoryName}</h3>
                  <p>
                    {categoryItems.length}{' '}
                    {categoryItems.length === 1 ? 'item' : 'items'}
                    {categoryDescription && (
                      <span> - {categoryDescription}</span>
                    )}
                  </p>
                </div>

                {/* Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
                <div role="list" aria-label={`${categoryName} items`}>
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      className="inventory-item"
                      role="listitem"
                    >
                      {/* Item Image (if available) */}
                      {item.image?.url && (
                        <div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image.url}
                            alt={item.name}
                            className="item-image"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Item Header: Name and Quantity */}
                      <div>
                        <h4 className="item-name">{item.name}</h4>
                        {item.stackable && (
                          <Badge
                            variant="secondary-static"
                            size="sm"
                            className="item-quantity"
                            aria-label={`Quantity: ${item.quantity}`}
                          >
                            ×{item.quantity}
                          </Badge>
                        )}
                      </div>

                      {/* Item Description */}
                      {item.description && (
                        <p className="item-description">{item.description}</p>
                      )}

                      {/* Item Metadata and Actions */}
                      <div>
                        {/* Category Badge and Acquisition Method */}
                        <div>
                          <Badge
                            variant="outline"
                            size="sm"
                            className="item-category"
                            aria-label={`Category: ${categoryName}`}
                          >
                            {categoryName}
                          </Badge>
                          {item.acquisitionHistory[0] && (
                            <span>{item.acquisitionHistory[0].method}</span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseItem(item.id)}
                            disabled={
                              usingItemId === item.id || item.quantity <= 0
                            }
                          >
                            {usingItemId === item.id ? 'Using...' : 'Use'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDropDialog(item)}
                            aria-label={`Drop ${item.name}`}
                            title="Drop item"
                          >
                            Drop
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

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
