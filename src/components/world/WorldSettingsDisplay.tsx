'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { WorldSettings } from '@/types/world.types';

interface WorldSettingsDisplayProps {
  settings?: WorldSettings;
}

export function WorldSettingsDisplay({ settings }: WorldSettingsDisplayProps) {
  return (
    <section className="bg-background rounded-lg border p-6 mb-6 shadow-sm" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="text-2xl font-semibold mb-4">
        Character creation rules for this world
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <DataField 
          label="Max Attributes" 
          value={settings?.maxAttributes || 'Not set'} 
          variant="inline"
        />
        <DataField 
          label="Max Skills" 
          value={settings?.maxSkills || 'Not set'} 
          variant="inline"
        />
        <DataField 
          label="Attribute Point Pool" 
          value={settings?.attributePointPool || 'Not set'} 
          variant="inline"
        />
        <DataField 
          label="Skill Point Pool" 
          value={settings?.skillPointPool || 'Not set'} 
          variant="inline"
        />
      </div>
    </section>
  );
}
