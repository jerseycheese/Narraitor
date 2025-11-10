'use client';

import React, { ReactNode } from 'react';

interface CategorizedItem {
  id: string;
  category?: string;
}

interface CategorizedListProps<T extends CategorizedItem> {
  items: T[];
  emptyMessage: string;
  showCategories?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  itemKeyPrefix?: string;
}

export function CategorizedList<T extends CategorizedItem>({
  items,
  emptyMessage,
  showCategories = false,
  renderItem,
  itemKeyPrefix = 'item'
}: CategorizedListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-4">
        {emptyMessage}
      </div>
    );
  }

  if (showCategories) {
    const categorized = items.reduce((acc, item) => {
      const category = item.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    return (
      <div className="space-y-6">
        {Object.entries(categorized).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 text-foreground capitalize">
              {category}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoryItems.map((item, index) => (
                <React.Fragment key={item.id || `${itemKeyPrefix}-${category}-${index}`}>
                  {renderItem(item, index)}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <React.Fragment key={item.id || `${itemKeyPrefix}-${index}`}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  );
}
