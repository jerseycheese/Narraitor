'use client';

import React from 'react';
import { WorldAttribute } from '@/types/world.types';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

interface WorldAttributesListProps {
  attributes: WorldAttribute[];
}

export function WorldAttributesList({ attributes }: WorldAttributesListProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      className="world-detail-section"
      title="Attributes that apply to characters in this world"
    >
      <div>
        {attributes.map((attr, index) => (
          <div key={`${attr.id ?? attr.name ?? index}`} >
            <div>
              <h3>{attr.name}</h3>
              <span>
                Range: {attr.minValue} - {attr.maxValue}
              </span>
            </div>
            {attr.description && (
              <p>{attr.description}</p>
            )}
            {attr.baseValue !== undefined && (
              <p>Default: {attr.baseValue}</p>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
