'use client';

import React from 'react';
// Use the store's Character type since it's more complete
import { characterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<typeof characterStore.getState>['characters'][string];
import { World } from '@/types/world.types';
import { CharacterAttributeDisplay } from './CharacterAttributeDisplay';
import { CharacterSkillDisplay } from './CharacterSkillDisplay';
import { CharacterBackgroundDisplay } from './CharacterBackgroundDisplay';
import { enrichCharacterAttributes, enrichCharacterSkills } from '@/lib/utils/characterDataEnrichment';

interface CharacterDetailsDisplayProps {
  character: StoreCharacter;
  world: World;
  showAttributes?: boolean;
  showSkills?: boolean;
  showBackground?: boolean;
  showCategories?: boolean;
}

export function CharacterDetailsDisplay({ 
  character, 
  world,
  showAttributes = true,
  showSkills = true,
  showBackground = true,
  showCategories = true
}: CharacterDetailsDisplayProps) {
  const enrichedAttributes = enrichCharacterAttributes(character, world);
  const enrichedSkills = enrichCharacterSkills(character, world);

  return (
    <div className="border-t pt-8 space-y-8">
      {showAttributes && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Attributes</h2>
          <CharacterAttributeDisplay 
            attributes={enrichedAttributes} 
            showCategories={showCategories} 
          />
        </section>
      )}

      {showSkills && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Skills</h2>
          <CharacterSkillDisplay 
            skills={enrichedSkills} 
            showCategories={showCategories} 
          />
        </section>
      )}

      {showBackground && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Background</h2>
          <CharacterBackgroundDisplay background={character.background} />
        </section>
      )}
    </div>
  );
}
