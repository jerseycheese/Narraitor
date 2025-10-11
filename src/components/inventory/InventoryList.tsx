'use client';

import React from 'react';
import { useInventoryStore } from '@/state/inventoryStore';
import { EntityID } from '@/types/common.types';
import { InventoryItem } from '@/types/inventory.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { getCategoryMetadata } from '@/lib/inventory/categories';
import type { StandardInventoryCategory } from '@/types/inventory.types';

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

  // Get all items for this character
  const items = getCharacterItems(characterId);

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.categoryId as StandardInventoryCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<StandardInventoryCategory, InventoryItem[]>);

  // Get categories that have items (sorted alphabetically for consistency)
  const populatedCategories = Object.keys(itemsByCategory).sort() as StandardInventoryCategory[];

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
    <div className={`space-y-6 ${className}`}>
      {populatedCategories.map((categoryId) => {
        const categoryItems = itemsByCategory[categoryId];
        const metadata = getCategoryMetadata(categoryId);
        const categoryName = metadata?.name || categoryId;

        return (
          <div key={categoryId} className="category-group">
            {/* Category Header with visual separation */}
            <div className="mb-4 border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {categoryName}
              </h3>
              <p className="text-sm text-gray-500">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>

            {/* Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 border border-gray-200 hover:border-gray-300 transition-colors inventory-item"
                >
                  {/* Item Header: Name and Quantity */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex-1 item-name">
                      {item.name}
                    </h4>
                    {item.stackable && (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="ml-2 item-quantity"
                      >
                        ×{item.quantity}
                      </Badge>
                    )}
                  </div>

                  {/* Item Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 item-description">
                      {item.description}
                    </p>
                  )}

                  {/* Item Metadata Footer */}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" size="sm" className="item-category">
                      {categoryName}
                    </Badge>
                    {item.stackable && item.maxStack && (
                      <span className="text-gray-500">
                        Max: {item.maxStack}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
