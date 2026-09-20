'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { World } from '@/types/world.types';
import { titleCase } from '@/lib/utils';

interface WorldInfoSectionProps {
  world: World;
}

export function WorldInfoSection({ world }: WorldInfoSectionProps) {
  if (!world.relationship && !world.reference) {
    return null;
  }

  return (
    <section
      className="world-detail-section"
      aria-labelledby="world-details-heading"
    >
      <h2 id="world-details-heading">World details</h2>
      <div className="world-detail-meta-grid">
        {world.relationship && (
          <DataField
            label="Relationship"
            value={titleCase(world.relationship.replace(/_/g, ' '))}
            variant="outline"
          />
        )}
        {world.reference && (
          <DataField
            label="Reference"
            value={world.reference}
            variant="outline"
          />
        )}
      </div>
    </section>
  );
}
