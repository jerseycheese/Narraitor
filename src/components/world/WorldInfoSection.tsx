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
    <section  aria-labelledby="world-details-heading">
      <h2 id="world-details-heading" >
        World details
      </h2>
      <div >
        <DataField 
          label="Created" 
          value={formatDate(world.createdAt)} 
          variant=""
        />
        <DataField 
          label="Updated" 
          value={formatDate(world.updatedAt)} 
          variant=""
        />
        {world.relationship && (
          <DataField 
            label="Relationship" 
            value={titleCase(world.relationship.replace(/_/g, ''))} 
            variant=""
          />
        )}
        {world.reference && (
          <DataField 
            label="Reference" 
            value={world.reference} 
            variant=""
          />
        )}
      </div>
    </section>
  );
}
