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
    <section className="bg-background rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4">World details</h2>
      <div className="grid grid-cols-2 gap-4">
        <DataField 
          label="Created" 
          value={formatDate(world.createdAt)} 
          variant="inline"
        />
        <DataField 
          label="Updated" 
          value={formatDate(world.updatedAt)} 
          variant="inline"
        />
        {world.relationship && (
          <DataField 
            label="Relationship" 
            value={titleCase(world.relationship.replace(/_/g, ' '))} 
            variant="inline"
          />
        )}
        {world.reference && (
          <DataField 
            label="Reference" 
            value={world.reference} 
            variant="inline"
          />
        )}
      </div>
    </section>
  );
}
