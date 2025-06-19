'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { WorldAttributesList } from './WorldAttributesList';
import { WorldSkillsList } from './WorldSkillsList';
import { WorldSettingsDisplay } from './WorldSettingsDisplay';
import { WorldInfoSection } from './WorldInfoSection';

interface WorldDetailsDisplayProps {
  world: World;
  showDescription?: boolean;
  showSettings?: boolean;
  showInfo?: boolean;
}

export function WorldDetailsDisplay({ 
  world, 
  showDescription = true,
  showSettings = true,
  showInfo = true 
}: WorldDetailsDisplayProps) {
  return (
    <>
      {showDescription && (
        <section className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700 leading-relaxed">{world.description}</p>
        </section>
      )}
      
      <WorldAttributesList attributes={world.attributes} />
      <WorldSkillsList skills={world.skills} attributes={world.attributes} />
      
      {showSettings && <WorldSettingsDisplay settings={world.settings} />}
      {showInfo && <WorldInfoSection world={world} />}
    </>
  );
}
