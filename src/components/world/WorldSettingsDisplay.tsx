'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { WorldSettings } from '@/types/world.types';

interface WorldSettingsDisplayProps {
  settings?: WorldSettings;
}

export function WorldSettingsDisplay({ settings }: WorldSettingsDisplayProps) {
  return (
    <section className="bg-white rounded-lg p-6 shadow mb-6">
      <h2 className="text-2xl font-semibold mb-4">World Settings</h2>
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
