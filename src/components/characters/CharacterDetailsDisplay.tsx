'use client';

import React from 'react';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<
  typeof useCharacterStore.getState
>['characters'][string];
import { World } from '@/types/world.types';
import { CharacterAttributeDisplay } from './CharacterAttributeDisplay';
import { CharacterSkillDisplay } from './CharacterSkillDisplay';
import { CharacterDerivedStatsDisplay } from './CharacterDerivedStatsDisplay';
import { CharacterBackgroundDisplay } from './CharacterBackgroundDisplay';
import {
  enrichCharacterAttributes,
  enrichCharacterSkills,
} from '@/lib/utils/characterDataEnrichment';

interface CharacterDetailsDisplayProps {
  character: StoreCharacter;
  world: World;
  showAttributes?: boolean;
  showSkills?: boolean;
  showDerivedStats?: boolean;
  showBackground?: boolean;
  showCategories?: boolean;
}

export function CharacterDetailsDisplay({
  character,
  world,
  showAttributes = true,
  showSkills = true,
  showDerivedStats = true,
  showBackground = true,
  showCategories = true,
}: CharacterDetailsDisplayProps) {
  const enrichedAttributes = enrichCharacterAttributes(character, world);
  const enrichedSkills = enrichCharacterSkills(character, world);

  return (
    <div>
      {showAttributes && (
        <section>
          <h2>Attributes</h2>
          <CharacterAttributeDisplay
            attributes={enrichedAttributes}
            showCategories={showCategories}
          />
        </section>
      )}

      {showDerivedStats &&
        character.derivedStats &&
        character.derivedStats.length > 0 && (
          <section>
            <h2>Derived Stats</h2>
            <CharacterDerivedStatsDisplay
              derivedStats={character.derivedStats}
            />
          </section>
        )}

      {showSkills && (
        <section>
          <h2>Skills</h2>
          <CharacterSkillDisplay
            skills={enrichedSkills}
            showCategories={showCategories}
          />
        </section>
      )}

      {showBackground && (
        <section>
          <h2>Background</h2>
          <CharacterBackgroundDisplay background={character.background} />
        </section>
      )}
    </div>
  );
}
