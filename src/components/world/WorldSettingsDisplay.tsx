'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { WorldSettings } from '@/types/world.types';

interface WorldSettingsDisplayProps {
  settings?: WorldSettings;
}

export function WorldSettingsDisplay({ settings }: WorldSettingsDisplayProps) {
  return (
    <section  aria-labelledby="settings-heading">
      <h2 id="settings-heading" >
        Character creation rules for this world
      </h2>
      <div >
        <DataField 
          label="Max Attributes" 
          value={settings?.maxAttributes || 'Not set'} 
          variant=""
        />
        <DataField 
          label="Max Skills" 
          value={settings?.maxSkills || 'Not set'} 
          variant=""
        />
        <DataField 
          label="Attribute Point Pool" 
          value={settings?.attributePointPool || 'Not set'} 
          variant=""
        />
        <DataField 
          label="Skill Point Pool" 
          value={settings?.skillPointPool || 'Not set'} 
          variant=""
        />
      </div>
    </section>
  );
}
