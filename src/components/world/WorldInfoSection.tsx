'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { World } from '@/types/world.types';
import { formatDate, titleCase } from '@/lib/utils';

interface WorldInfoSectionProps {
  world: World;
}

export function WorldInfoSection({ world }: WorldInfoSectionProps) {
  return (
    <section
      className="world-detail-section"
      aria-labelledby="world-details-heading"
    >
      <h2 id="world-details-heading">World details</h2>
      <div className="world-detail-meta-grid">
        <DataField
          label="Created"
          value={formatDate(world.createdAt)}
          variant="outline"
        />
        <DataField
          label="Updated"
          value={formatDate(world.updatedAt)}
          variant="outline"
        />
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
