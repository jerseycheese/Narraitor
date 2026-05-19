'use client';

import React from 'react';

interface PropertyLike {
  id: string;
  category?: string;
}

export interface CharacterPropertyGridProps<T extends PropertyLike> {
  items: T[];
  kind: 'attribute' | 'skill';
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
  showCategories?: boolean;
}

export function CharacterPropertyGrid<T extends PropertyLike>({
  items,
  kind,
  emptyText,
  renderItem,
  showCategories = false,
}: CharacterPropertyGridProps<T>) {
  const wrapperClass = `component-character-${kind}-display`;
  const gridClass = `character-${kind}-grid`;
  const categoriesClass = `character-${kind}-categories`;
  const categoryClass = `character-${kind}-category`;
  const categoryHeadingClass = `character-${kind}-category-heading`;

  if (items.length === 0) {
    return (
      <div className={wrapperClass}>
        <div className="character-display-empty">{emptyText}</div>
      </div>
    );
  }

  if (showCategories) {
    const grouped = items.reduce((acc, item) => {
      const category = item.category || 'general';
      (acc[category] ||= []).push(item);
      return acc;
    }, {} as Record<string, T[]>);

    return (
      <div className={wrapperClass}>
        <div className={categoriesClass}>
          {Object.entries(grouped).map(([category, group]) => (
            <div key={category} className={categoryClass}>
              <h3 className={categoryHeadingClass}>{category}</h3>
              <div className={gridClass}>
                {group.map((item, index) => (
                  <React.Fragment key={item.id || `${kind}-${category}-${index}`}>
                    {renderItem(item)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className={gridClass}>
        {items.map((item, index) => (
          <React.Fragment key={item.id || `${kind}-${index}`}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
