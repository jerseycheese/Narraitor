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
    <SectionWrapper title="Attributes that apply to characters in this world">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributes.map((attr, index) => (
          <div key={`${attr.id ?? attr.name ?? index}`} className="bg-muted rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{attr.name}</h3>
              <span className="text-sm text-muted-foreground">
                Range: {attr.minValue} - {attr.maxValue}
              </span>
            </div>
            {attr.description && (
              <p className="text-muted-foreground text-sm">{attr.description}</p>
            )}
            {attr.baseValue !== undefined && (
              <p className="text-sm text-muted-foreground mt-2">Default: {attr.baseValue}</p>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
