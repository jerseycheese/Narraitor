'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { WorldAttributesList } from './WorldAttributesList';
import { WorldSkillsList } from './WorldSkillsList';
import { WorldSettingsDisplay } from './WorldSettingsDisplay';
import { ToneSettingsDisplay } from './ToneSettingsDisplay';
import { WorldImageDisplay } from './WorldImageDisplay';
import { WorldInfoSection } from './WorldInfoSection';

interface WorldDetailsDisplayProps {
  world: World;
  showDescription?: boolean;
  showSettings?: boolean;
  showToneSettings?: boolean;
  showImageDetails?: boolean;
  showInfo?: boolean;
}

export function WorldDetailsDisplay({
  world,
  showDescription = true,
  showSettings = true,
  showToneSettings = true,
  showImageDetails = true,
  showInfo = true
}: WorldDetailsDisplayProps) {
  return (
    <>
      {showDescription && (
        <section className="bg-background rounded-lg border p-6 mb-6 shadow-sm" aria-labelledby="world-description-heading">
          <h2 id="world-description-heading" className="text-2xl font-semibold mb-4">
            About this world
          </h2>
          <p className="text-muted-foreground leading-relaxed">{world.description}</p>
        </section>
      )}
      
      <WorldAttributesList attributes={world.attributes} />
      <WorldSkillsList skills={world.skills} attributes={world.attributes} />

      {showSettings && <WorldSettingsDisplay settings={world.settings} />}
      {showToneSettings && <ToneSettingsDisplay toneSettings={world.toneSettings} />}
      {showImageDetails && <WorldImageDisplay image={world.image} />}
      {showInfo && <WorldInfoSection world={world} />}
    </>
  );
}
