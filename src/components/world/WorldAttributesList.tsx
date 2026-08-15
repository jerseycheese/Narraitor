'use client';

import React from 'react';
import { WorldAttribute } from '@/types/world.types';

interface WorldAttributesListProps {
  attributes: WorldAttribute[];
}

export function WorldAttributesList({ attributes }: WorldAttributesListProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <section
      className="world-detail-section world-detail-attributes"
      aria-labelledby="world-attributes-heading"
    >
      <h2 id="world-attributes-heading">Attributes</h2>
      <div className="world-detail-stat-list">
        {attributes.map((attr, index) => (
          <div key={`${attr.id ?? attr.name ?? index}`} className="world-detail-stat">
            <div className="world-detail-stat-head">
              <h3 className="world-detail-stat-name">{attr.name}</h3>
              <span className="world-detail-stat-range">
                Range: {attr.minValue} – {attr.maxValue}
              </span>
            </div>
            {attr.description && (
              <p className="world-detail-stat-description">{attr.description}</p>
            )}
            {attr.baseValue !== undefined && (
              <p className="world-detail-stat-default">Default: {attr.baseValue}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
