'use client';

import React, { useState } from 'react';
import { useInventoryStore } from '@/state/inventoryStore';
import { useSessionStore } from '@/state/sessionStore';
import { EntityID } from '@/types/common.types';
import { InventoryItem } from '@/types/inventory.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { getCategoryMetadata, STANDARD_CATEGORIES } from '@/lib/inventory/categories';
import type { StandardInventoryCategory } from '@/types/inventory.types';
import { processItemUsage } from '@/lib/inventory/itemUsageService';
import { InventoryViewToggle, type InventoryViewMode } from './InventoryViewToggle';
import { InventoryTable } from './InventoryTable';

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
  const { getCharacterItems } = useInventoryStore();
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

  // Get all items for this character
  const items = getCharacterItems(characterId);

  // Handle item usage
  const handleUseItem = async (itemId: EntityID) => {
    setUsingItemId(itemId);
    setErrorFeedback(null);

    try {
      const result = await processItemUsage(characterId, itemId, sessionId || undefined);

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
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.categoryId as StandardInventoryCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<StandardInventoryCategory, InventoryItem[]>);

  // Get categories that have items (in canonical order from STANDARD_CATEGORIES)
  const populatedCategories = STANDARD_CATEGORIES.filter(
    (category) => itemsByCategory[category]?.length > 0
  );

  // Empty state when no items
  if (items.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <EmptyState
          title="No items in inventory"
          description="Items will appear here as they are added"
          variant="centered"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} role="region" aria-label="Character inventory">
      {/* View Toggle */}
      <div className="flex justify-end">
        <InventoryViewToggle mode={viewMode} onModeChange={handleViewModeChange} />
      </div>

      {/* Feedback message */}
      {errorFeedback && (
        <div
          className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200"
          role="alert"
        >
          {errorFeedback}
        </div>
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
            <div className="mb-4 border-b border-border pb-2">
              <h3
                id={`category-${categoryId}`}
                className="text-lg font-semibold text-foreground"
              >
                {categoryName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                {categoryDescription && (
                  <span className="sr-only"> - {categoryDescription}</span>
                )}
              </p>
            </div>

            {/* Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="list"
              aria-label={`${categoryName} items`}
            >
              {categoryItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 border border-border hover:border-border/80 transition-colors inventory-item"
                  role="listitem"
                >
                  {/* Item Header: Name and Quantity */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground flex-1 item-name">
                      {item.name}
                    </h4>
                    {item.stackable && (
                      <Badge
                        variant="secondary-static"
                        size="sm"
                        className="ml-2 item-quantity"
                        aria-label={`Quantity: ${item.quantity}`}
                      >
                        ×{item.quantity}
                      </Badge>
                    )}
                  </div>

                  {/* Item Description */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 item-description">
                      {item.description}
                    </p>
                  )}

                  {/* Item Metadata Footer */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        size="sm"
                        className="item-category hover:bg-white"
                        aria-label={`Category: ${categoryName}`}
                      >
                        {categoryName}
                      </Badge>
                      {item.stackable && item.maxStack && (
                        <span className="text-muted-foreground" aria-label={`Maximum stack size: ${item.maxStack}`}>
                          Max: {item.maxStack}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseItem(item.id)}
                      disabled={usingItemId === item.id || item.quantity <= 0}
                      className="ml-auto"
                    >
                      {usingItemId === item.id ? 'Using...' : 'Use'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
        </>
      )}
    </div>
  );
};
