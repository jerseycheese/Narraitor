'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { World } from '@/types/world.types';

interface WorldInfoSectionProps {
  world: World;
}

export function WorldInfoSection({ world }: WorldInfoSectionProps) {
  return (
    <section className="bg-white rounded-lg p-6 shadow mb-6">
      <h2 className="text-2xl font-semibold mb-4">Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <DataField 
          label="Created" 
          value={new Date(world.createdAt).toLocaleDateString()} 
          variant="inline"
        />
        <DataField 
          label="Updated" 
          value={new Date(world.updatedAt).toLocaleDateString()} 
          variant="inline"
        />
        {world.relationship && (
          <DataField 
            label="Relationship" 
            value={world.relationship.replace(/_/g, ' ').charAt(0).toUpperCase() + world.relationship.slice(1).replace(/_/g, ' ')} 
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
